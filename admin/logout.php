<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminLogout();
header('Location: /admin/index.php');
exit;
