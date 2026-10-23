<?php
/**
 * Zero-Dependency Pure PHP SSL SMTP Mailer
 * Compatible with Hostinger Shared Hosting (PHP 7.4 - 8.3+)
 */

class SmtpMailer {
    private $host;
    private $port;
    private $secure;
    private $username;
    private $password;
    private $timeout;
    private $debugLog = [];

    public function __construct(string $host, int $port, string $secure, string $username, string $password, int $timeout = 25) {
        $this->host = $host;
        $this->port = $port;
        $this->secure = strtolower($secure);
        $this->username = $username;
        $this->password = $password;
        $this->timeout = $timeout;
    }

    /**
     * Get debug conversation log
     */
    public function getDebugLog(): array {
        return $this->debugLog;
    }

    private function log($message) {
        $this->debugLog[] = $message;
    }

    /**
     * Send an HTML Email to multiple recipients
     */
    public function send(array $toEmails, string $subject, string $htmlBody, string $fromEmail, string $fromName): bool {
        if (empty($toEmails)) {
            $this->log("[ERROR] No recipient emails provided.");
            return false;
        }

        // If password is still placeholder, record notice
        if ($this->password === 'willprovidelater' || empty($this->password)) {
            $this->log("[NOTICE] SMTP Password is set to 'willprovidelater'. Please configure your actual Hostinger SMTP password.");
            return false;
        }

        $hostPrefix = ($this->secure === 'ssl') ? 'ssl://' : '';
        $targetHost = $hostPrefix . $this->host;

        $this->log("Connecting to {$targetHost}:{$this->port}...");
        
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $socket = @stream_socket_client(
            $targetHost . ':' . $this->port,
            $errno,
            $errstr,
            $this->timeout,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$socket) {
            $this->log("[ERROR] Connection failed: {$errstr} ({$errno})");
            return false;
        }

        stream_set_timeout($socket, $this->timeout);

        try {
            $response = $this->readResponse($socket);
            $this->log("SERVER: {$response}");
            if (substr($response, 0, 3) !== '220') {
                throw new Exception("Unexpected greeting: {$response}");
            }

            // EHLO
            $this->sendCommand($socket, "EHLO " . gethostname());
            $response = $this->readResponse($socket);
            $this->log("EHLO: {$response}");

            // AUTH LOGIN
            $this->sendCommand($socket, "AUTH LOGIN");
            $response = $this->readResponse($socket);
            if (substr($response, 0, 3) !== '334') {
                throw new Exception("AUTH LOGIN rejected: {$response}");
            }

            // Username
            $this->sendCommand($socket, base64_encode($this->username));
            $response = $this->readResponse($socket);
            if (substr($response, 0, 3) !== '334') {
                throw new Exception("Username rejected: {$response}");
            }

            // Password
            $this->sendCommand($socket, base64_encode($this->password));
            $response = $this->readResponse($socket);
            if (substr($response, 0, 3) !== '235') {
                throw new Exception("Authentication failed (Check password): {$response}");
            }

            // MAIL FROM
            $this->sendCommand($socket, "MAIL FROM: <{$fromEmail}>");
            $response = $this->readResponse($socket);
            if (substr($response, 0, 3) !== '250') {
                throw new Exception("MAIL FROM rejected: {$response}");
            }

            // RCPT TO for each recipient
            foreach ($toEmails as $recipient) {
                $this->sendCommand($socket, "RCPT TO: <{$recipient}>");
                $response = $this->readResponse($socket);
                if (substr($response, 0, 3) !== '250' && substr($response, 0, 3) !== '251') {
                    throw new Exception("Recipient {$recipient} rejected: {$response}");
                }
            }

            // DATA
            $this->sendCommand($socket, "DATA");
            $response = $this->readResponse($socket);
            if (substr($response, 0, 3) !== '354') {
                throw new Exception("DATA command rejected: {$response}");
            }

            // Prepare RFC-5322 & RFC-2046 compliant MIME headers for maximum spam filter deliverability
            $domain = substr(strrchr($fromEmail, "@"), 1) ?: 'zeehash.com';
            $messageId = sprintf("<%s.%s@%s>", date('YmdHis'), bin2hex(random_bytes(8)), $domain);
            $boundary = "----=_ZeeHash_Part_" . md5(uniqid((string)time(), true));

            $headers = [];
            $headers[] = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>";
            $headers[] = "Reply-To: <{$fromEmail}>";
            $headers[] = "Return-Path: <{$fromEmail}>";
            $headers[] = "To: " . implode(', ', $toEmails);
            $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
            $headers[] = "Date: " . date('r');
            $headers[] = "Message-ID: {$messageId}";
            $headers[] = "X-Mailer: ZeeHash Care Engine v1.0";
            $headers[] = "Auto-Submitted: auto-generated";
            $headers[] = "MIME-Version: 1.0";
            $headers[] = "Content-Type: multipart/alternative; boundary=\"{$boundary}\"";

            // Generate clean plain-text version for anti-spam heuristics (SpamAssassin, Gmail, Outlook)
            $plainText = $this->generatePlainText($htmlBody);

            $body = "--{$boundary}\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $body .= chunk_split(base64_encode($plainText)) . "\r\n";

            $body .= "--{$boundary}\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $body .= chunk_split(base64_encode($htmlBody)) . "\r\n";

            $body .= "--{$boundary}--\r\n";

            $fullPayload = implode("\r\n", $headers) . "\r\n\r\n" . $body . ".";

            $this->sendCommand($socket, $fullPayload);
            $response = $this->readResponse($socket);
            if (substr($response, 0, 3) !== '250') {
                throw new Exception("Sending failed: {$response}");
            }

            // QUIT
            $this->sendCommand($socket, "QUIT");
            fclose($socket);

            $this->log("[SUCCESS] Email successfully sent to: " . implode(', ', $toEmails));
            return true;

        } catch (Exception $e) {
            $this->log("[EXCEPTION] " . $e->getMessage());
            @fclose($socket);
            return false;
        }
    }

    /**
     * Converts HTML email template into clean plain-text fallback
     * Required by spam engines to avoid HTML-only penalization
     */
    private function generatePlainText(string $html): string {
        $clean = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);
        $clean = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $clean);
        $text = preg_replace('/<\/(p|div|h[1-6]|tr|li)>/i', "\n", $clean);
        $text = preg_replace('/<br\s*\/?>/i', "\n", $text);
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n\s*\n+/', "\n\n", $text);
        return trim($text);
    }

    private function sendCommand($socket, string $command) {
        fwrite($socket, $command . "\r\n");
    }

    private function readResponse($socket): string {
        $data = '';
        while (!feof($socket)) {
            $str = fgets($socket, 515);
            $data .= $str;
            if (substr($str, 3, 1) === ' ') {
                break;
            }
        }
        return trim($data);
    }
}
