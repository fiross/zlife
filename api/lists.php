<?php
/**
 * API: Master Lists (Medications, Moods, Behaviors, Interventions, Foods, Activities, Exercises)
 */

require_once __DIR__ . '/bootstrap.php';

require_api_role(); // Must be logged in

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $all = isset($_GET['all']) && $_GET['all'] == '1';
    
    $sql = "SELECT * FROM master_lists";
    if (!$all) {
        $sql .= " WHERE is_active = 1";
    }
    $sql .= " ORDER BY category ASC, id ASC";
    
    $rows = $pdo->query($sql)->fetchAll();
    $grouped = [];
    foreach ($rows as $row) {
        $grouped[$row['category']][] = [
            'id' => (int)$row['id'],
            'category' => $row['category'],
            'item_name' => $row['item_name'],
            'is_active' => (int)$row['is_active']
        ];
    }

    json_response(['success' => true, 'data' => $grouped]);
}

if ($method === 'POST') {
    require_api_role('parent'); // Parent only
    $input = get_json_input();
    $action = $input['action'] ?? 'add';

    if ($action === 'toggle') {
        $id = intval($input['id'] ?? 0);
        $isActive = isset($input['is_active']) ? (int)$input['is_active'] : null;

        if ($id <= 0) {
            json_response(['success' => false, 'error' => 'Invalid item ID'], 400);
        }

        if ($isActive === null) {
            // Flip current state
            $stmt = $pdo->prepare("UPDATE master_lists SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?");
            $stmt->execute([$id]);
        } else {
            $stmt = $pdo->prepare("UPDATE master_lists SET is_active = ? WHERE id = ?");
            $stmt->execute([$isActive ? 1 : 0, $id]);
        }

        json_response(['success' => true, 'message' => 'Item status updated!']);
    }

    if ($action === 'add') {
        $category = trim($input['category'] ?? '');
        $itemName = trim($input['item_name'] ?? '');

        $allowedCategories = ['mood', 'medication', 'food', 'behavior', 'intervention', 'exercise', 'activity'];
        if (!in_array($category, $allowedCategories, true)) {
            json_response(['success' => false, 'error' => 'Invalid category selected.'], 400);
        }

        if (empty($itemName)) {
            json_response(['success' => false, 'error' => 'Item name cannot be empty.'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO master_lists (category, item_name, is_active) VALUES (?, ?, 1)");
        $stmt->execute([$category, $itemName]);
        $newId = (int)$pdo->lastInsertId();

        json_response([
            'success' => true,
            'message' => "Added '$itemName' to " . ucfirst($category) . "!",
            'data' => [
                'id' => $newId,
                'category' => $category,
                'item_name' => $itemName,
                'is_active' => 1
            ]
        ]);
    }

    json_response(['success' => false, 'error' => 'Unknown action.'], 400);
}

json_response(['error' => 'Method not allowed'], 405);
