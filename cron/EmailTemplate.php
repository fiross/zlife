<?php
/**
 * ZeeHash Daily Tracker - Rich HTML Email Template
 * Pediatric Neurodivergent Aesthetic (Gmail, Apple Mail, Outlook Compatible)
 */

class EmailTemplate {

    public static function render(array $params): string {
        $childName = htmlspecialchars(!empty($params['child_name']) ? $params['child_name'] : 'Child');
        $todayDate = htmlspecialchars($params['today_date'] ?? date('l, F j, Y'));
        $currentTime = htmlspecialchars($params['current_time'] ?? date('g:i A T'));
        $appUrl = htmlspecialchars($params['app_url'] ?? 'https://zeba.zeehash.com');
        
        $isTodayMissing = !empty($params['is_today_missing']);
        $todayMood = htmlspecialchars($params['today_mood'] ?? '');
        $todaySleep = htmlspecialchars($params['today_sleep'] ?? '');
        
        $hasLastLog = !empty($params['has_last_log']);
        $lastDate = htmlspecialchars($params['last_date'] ?? 'Previous Day');
        $lastMood = htmlspecialchars($params['last_mood'] ?? 'Not Recorded');
        $lastSleep = htmlspecialchars($params['last_sleep'] ?? '0');
        $lastNotes = htmlspecialchars($params['last_notes'] ?? '');
        $lastMenstruating = !empty($params['last_menstruating']);
        $lastFlow = htmlspecialchars($params['last_flow'] ?? 'Medium');

        $doneMeds = $params['done_meds'] ?? [];
        $doneSensory = $params['done_sensory'] ?? [];
        $doneInterventions = $params['done_interventions'] ?? [];
        $doneCreative = $params['done_creative'] ?? [];
        $doneExercise = $params['done_exercise'] ?? [];
        $doneFood = $params['done_food'] ?? [];
        
        $missedInterventions = !empty($params['missed_interventions']);
        $missedCreative = !empty($params['missed_creative']);
        $missedExercise = !empty($params['missed_exercise']);
        
        $clinicalRationales = $params['clinical_rationales'] ?? [];

        // Mood styling & emoji helper
        $getMoodStyle = function($mood) {
            switch (strtolower($mood)) {
                case 'calm':
                    return ['style' => 'background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;', 'emoji' => '😌'];
                case 'happy':
                    return ['style' => 'background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a;', 'emoji' => '😊'];
                case 'aggressive':
                    return ['style' => 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;', 'emoji' => '😡'];
                case 'anxiety':
                    return ['style' => 'background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff;', 'emoji' => '😰'];
                case 'hyperactive':
                    return ['style' => 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;', 'emoji' => '⚡'];
                case 'sensory overload':
                    return ['style' => 'background-color: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8;', 'emoji' => '💥'];
                case 'withdrawn':
                    return ['style' => 'background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;', 'emoji' => '😶'];
                default:
                    return ['style' => 'background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;', 'emoji' => '📋'];
            }
        };

        $lastMoodInfo = $getMoodStyle($lastMood);
        $todayMoodInfo = $todayMood ? $getMoodStyle($todayMood) : null;

        ob_start();
        ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZeeHash Daily Care Summary & Evening Check</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; }
    .card { background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; }
    .tag-bubble { display: inline-block; padding: 3px 10px; border-radius: 14px; font-size: 12px; font-weight: 700; margin: 2px 4px 2px 0; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9;">

  <center>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; text-align: left;">
      
      <!-- HEADER BRANDING -->
      <tr>
        <td style="padding-bottom: 18px; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <span style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 6px 16px; border-radius: 30px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(13,148,136,0.2);">
                  🌱 ZEEHASH CARE INTELLIGENCE
                </span>
                <h1 style="margin: 12px 0 4px 0; font-size: 24px; font-weight: 800; color: #0f172a;">
                  Daily Care Summary & Evening Report
                </h1>
                <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 600;">
                  Personalized Tracking for <?= $childName ?> • <?= $todayDate ?> (<?= $currentTime ?>)
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- MAIN CONTAINER -->
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="box-shadow: 0 4px 14px rgba(15,23,42,0.06);">
            
            <!-- 1. TODAY'S STATUS SECTION -->
            <?php if ($isTodayMissing): ?>
            <!-- TODAY MISSING ALERT BANNER -->
            <tr>
              <td style="background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border-bottom: 2px solid #fecdd3; padding: 20px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="width: 44px;">
                      <div style="background-color: #e11d48; color: #ffffff; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; line-height: 36px; text-align: center; font-weight: bold;">
                        ⏰
                      </div>
                    </td>
                    <td valign="top" style="padding-left: 12px;">
                      <span style="font-size: 11px; font-weight: 800; color: #be123c; text-transform: uppercase; letter-spacing: 0.5px;">
                        ACTION NEEDED BEFORE 10:00 PM CST
                      </span>
                      <h2 style="margin: 3px 0 6px 0; font-size: 17px; font-weight: 800; color: #881337;">
                        Today's Care Log Has Not Been Submitted Yet
                      </h2>
                      <p style="margin: 0 0 12px 0; font-size: 13px; color: #9f1239; line-height: 1.5;">
                        Please submit <?= $childName ?>'s bedtime, administered medications, and sensory mood observations for today to keep care analytics continuous.
                      </p>
                      
                      <!-- CTA BUTTON -->
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius: 8px; background-color: #0f766e;">
                            <a href="<?= $appUrl ?>" target="_blank" style="display: inline-block; padding: 10px 20px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                              👉 Open Daily Tracker & Log Today
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <?php else: ?>
            <!-- TODAY LOGGED CELEBRATION BANNER -->
            <tr>
              <td style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-bottom: 2px solid #bbf7d0; padding: 16px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="middle" style="width: 36px;">
                      <div style="background-color: #16a34a; color: #ffffff; width: 30px; height: 30px; border-radius: 50%; font-size: 16px; line-height: 30px; text-align: center; font-weight: bold;">
                        ✓
                      </div>
                    </td>
                    <td valign="middle" style="padding-left: 12px;">
                      <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase;">
                        TODAY'S CARE LOG COMPLETED
                      </span>
                      <div style="font-size: 14px; font-weight: 800; color: #14532d; margin-top: 2px;">
                        Today (<?= $todayDate ?>) is logged: 
                        <?php if ($todayMoodInfo): ?>
                          <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 4px; <?= $todayMoodInfo['style'] ?>">
                            <?= $todayMoodInfo['emoji'] ?> <?= $todayMood ?>
                          </span>
                        <?php endif; ?>
                        <?php if ($todaySleep): ?>
                          <span style="font-size: 13px; color: #15803d; margin-left: 6px;">• 🌙 <?= $todaySleep ?> hrs sleep</span>
                        <?php endif; ?>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <?php endif; ?>

            <!-- 2. FULL YESTERDAY CARE SUMMARY SECTION -->
            <tr>
              <td style="padding: 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  
                  <tr>
                    <td>
                      <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 18px;">
                        <span style="font-size: 11px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
                          DETAILED DAILY SUMMARY
                        </span>
                        <h3 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">
                          Yesterday's Recorded Care & Activities (<?= $lastDate ?>)
                        </h3>
                      </div>
                    </td>
                  </tr>

                  <!-- METRICS BANNER (Mood, Sleep, Cycle) -->
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 14px 16px;" width="38%">
                            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Recorded Mood:</span>
                            <div style="margin-top: 4px;">
                              <span class="pill" style="<?= $lastMoodInfo['style'] ?>">
                                <?= $lastMoodInfo['emoji'] ?> <?= $lastMood ?>
                              </span>
                            </div>
                          </td>
                          <td style="padding: 14px 16px; border-left: 1px solid #e2e8f0;" width="32%">
                            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Sleep Logged:</span>
                            <div style="margin-top: 4px; font-size: 14px; font-weight: 800; color: #1e293b;">
                              🌙 <?= $lastSleep ?> Hours
                            </div>
                          </td>
                          <td style="padding: 14px 16px; border-left: 1px solid #e2e8f0;" width="30%">
                            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Cycle:</span>
                            <div style="margin-top: 4px; font-size: 13px; font-weight: 800; color: <?= $lastMenstruating ? '#be123c' : '#64748b' ?>;">
                              <?= $lastMenstruating ? "🩸 {$lastFlow} Flow" : "— None" ?>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- WHAT WAS GIVEN & PERFORMED -->
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        
                        <!-- Medications Administered -->
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
                              <tr>
                                <td>
                                  <div style="font-size: 13px; font-weight: 800; color: #0d9488; margin-bottom: 4px;">
                                    💊 Medications Administered:
                                  </div>
                                  <div style="font-size: 13px; color: #1e293b;">
                                    <?php if (!empty($doneMeds)): ?>
                                      <?php foreach ($doneMeds as $med): ?>
                                        <span class="tag-bubble" style="background-color: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4;">✓ <?= htmlspecialchars($med) ?></span>
                                      <?php endforeach; ?>
                                    <?php else: ?>
                                      <span style="color: #94a3b8; font-style: italic;">None recorded for this day</span>
                                    <?php endif; ?>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Calming Interventions Given -->
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: <?= $missedInterventions ? '#fff7ed' : '#f0fdf4' ?>; border: 1px solid <?= $missedInterventions ? '#fed7aa' : '#bbf7d0' ?>; border-radius: 10px; padding: 12px 14px;">
                              <tr>
                                <td>
                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="font-size: 13px; font-weight: 800; color: <?= $missedInterventions ? '#9a3412' : '#166534' ?>;">
                                        🤲 Calming Interventions Given:
                                      </td>
                                      <td align="right" style="font-size: 11px; font-weight: 800; color: <?= $missedInterventions ? '#ea580c' : '#15803d' ?>;">
                                        <?= $missedInterventions ? '⚠️ NONE GIVEN / MISSED' : '✓ COMPLETED (' . count($doneInterventions) . ')' ?>
                                      </td>
                                    </tr>
                                  </table>
                                  <div style="font-size: 13px; color: #1e293b; margin-top: 6px;">
                                    <?php if (!empty($doneInterventions)): ?>
                                      <?php foreach ($doneInterventions as $item): ?>
                                        <span class="tag-bubble" style="background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">✓ <?= htmlspecialchars($item) ?></span>
                                      <?php endforeach; ?>
                                    <?php else: ?>
                                      <span style="color: #c2410c; font-weight: 600;">No calming interventions were applied on this day.</span>
                                    <?php endif; ?>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Creative & Skill Activities -->
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: <?= $missedCreative ? '#fff7ed' : '#faf5ff' ?>; border: 1px solid <?= $missedCreative ? '#fed7aa' : '#e9d5ff' ?>; border-radius: 10px; padding: 12px 14px;">
                              <tr>
                                <td>
                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="font-size: 13px; font-weight: 800; color: <?= $missedCreative ? '#9a3412' : '#6b21a8' ?>;">
                                        🎵 Creative & Skill Activities:
                                      </td>
                                      <td align="right" style="font-size: 11px; font-weight: 800; color: <?= $missedCreative ? '#ea580c' : '#7c3aed' ?>;">
                                        <?= $missedCreative ? '⚠️ NOT LOGGED' : '✓ COMPLETED (' . count($doneCreative) . ')' ?>
                                      </td>
                                    </tr>
                                  </table>
                                  <div style="font-size: 13px; color: #1e293b; margin-top: 6px;">
                                    <?php if (!empty($doneCreative)): ?>
                                      <?php foreach ($doneCreative as $item): ?>
                                        <span class="tag-bubble" style="background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff;">✓ <?= htmlspecialchars($item) ?></span>
                                      <?php endforeach; ?>
                                    <?php else: ?>
                                      <span style="color: #c2410c; font-weight: 600;">No music, keyboard, or speech therapy practiced.</span>
                                    <?php endif; ?>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Exercise & Physical Play -->
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: <?= $missedExercise ? '#fff7ed' : '#f0fdf4' ?>; border: 1px solid <?= $missedExercise ? '#fed7aa' : '#bbf7d0' ?>; border-radius: 10px; padding: 12px 14px;">
                              <tr>
                                <td>
                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="font-size: 13px; font-weight: 800; color: <?= $missedExercise ? '#9a3412' : '#166534' ?>;">
                                        🏃 Exercise & Physical Movement:
                                      </td>
                                      <td align="right" style="font-size: 11px; font-weight: 800; color: <?= $missedExercise ? '#ea580c' : '#15803d' ?>;">
                                        <?= $missedExercise ? '⚠️ NOT LOGGED' : '✓ COMPLETED (' . count($doneExercise) . ')' ?>
                                      </td>
                                    </tr>
                                  </table>
                                  <div style="font-size: 13px; color: #1e293b; margin-top: 6px;">
                                    <?php if (!empty($doneExercise)): ?>
                                      <?php foreach ($doneExercise as $item): ?>
                                        <span class="tag-bubble" style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;">✓ <?= htmlspecialchars($item) ?></span>
                                      <?php endforeach; ?>
                                    <?php else: ?>
                                      <span style="color: #c2410c; font-weight: 600;">No pickleball, badminton, sensory walk, or gross-motor exercise recorded.</span>
                                    <?php endif; ?>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Sensory Behaviors Observed -->
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 12px 14px;">
                              <tr>
                                <td>
                                  <div style="font-size: 13px; font-weight: 800; color: #be123c; margin-bottom: 4px;">
                                    🎧 Sensory Behaviors & Stimming Observed:
                                  </div>
                                  <div style="font-size: 13px; color: #1e293b;">
                                    <?php if (!empty($doneSensory)): ?>
                                      <?php foreach ($doneSensory as $item): ?>
                                        <span class="tag-bubble" style="background-color: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3;">• <?= htmlspecialchars($item) ?></span>
                                      <?php endforeach; ?>
                                    <?php else: ?>
                                      <span style="color: #9f1239;">No distressing sensory triggers or adverse stimming recorded</span>
                                    <?php endif; ?>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Food & Meals -->
                        <?php if (!empty($doneFood)): ?>
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
                              <tr>
                                <td>
                                  <div style="font-size: 13px; font-weight: 800; color: #c2410c; margin-bottom: 4px;">
                                    🥑 Food & Nutrition:
                                  </div>
                                  <div style="font-size: 13px; color: #1e293b;">
                                    <?php foreach ($doneFood as $f): ?>
                                      <span class="tag-bubble" style="background-color: #ffedd5; color: #9a3412; border: 1px solid #fed7aa;"><?= htmlspecialchars($f) ?></span>
                                    <?php endforeach; ?>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <?php endif; ?>

                        <!-- Caregiver Notes -->
                        <?php if (!empty($lastNotes)): ?>
                        <tr>
                          <td style="padding-bottom: 14px;">
                            <div style="background-color: #f8fafc; border-left: 3px solid #0f766e; padding: 10px 14px; border-radius: 4px; font-size: 13px; color: #334155; font-style: italic;">
                              "<?= $lastNotes ?>"
                            </div>
                          </td>
                        </tr>
                        <?php endif; ?>

                      </table>
                    </td>
                  </tr>

                  <!-- 3. CLINICAL WHY / IMPORTANCE BASED ON RECORDED MOOD -->
                  <?php if (!empty($clinicalRationales)): ?>
                  <tr>
                    <td style="padding-top: 10px;">
                      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0f766e; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #0f766e;">
                          💡 Why These Routines Matter For <?= $childName ?> When Mood Is "<?= $lastMood ?>":
                        </h4>
                        <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 13px; line-height: 1.6;">
                          <?php foreach ($clinicalRationales as $rationale): ?>
                            <li style="margin-bottom: 8px;"><?= $rationale ?></li>
                          <?php endforeach; ?>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <?php endif; ?>

                  <!-- 4. SENSORY SOS QUICK GUIDE -->
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 14px 16px;">
                        <tr>
                          <td>
                            <div style="font-size: 13px; font-weight: 800; color: #6b21a8; margin-bottom: 4px;">
                              🚨 Emergency Calming Protocol (Sensory SOS)
                            </div>
                            <div style="font-size: 12px; color: #7e22ce; line-height: 1.5;">
                              1. 🎧 <strong>Noise Dampening:</strong> Offer Walker's Earmuffs immediately.<br>
                              2. 🤲 <strong>Deep Joint Pressure:</strong> Compression on shoulders/arms + weighted cocoon.<br>
                              3. ⏳ <strong>Visual Predictability:</strong> Dim lighting and show clear visual timer.<br>
                              4. 🍬 <strong>Oral Sensory:</strong> Offer chewing gum or crunchy/salty proprioceptive snack.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                  ZeeHash Adaptive Care Intelligence for <?= $childName ?>
                </p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                  Automated evening report sent to parents (<a href="<?= $appUrl ?>" style="color: #0f766e; text-decoration: none; font-weight: bold;">Manage Settings in Tracker</a>).
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>

    </table>
  </center>

</body>
</html>
        <?php
        return ob_get_clean();
    }
}
