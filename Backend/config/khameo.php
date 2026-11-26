<?php

return [

    // Version of the recording consent text (docs/api-onboarding.md section 1). Bump it when the text
    // changes; agreeing again to the same version keeps the original time.
    'consent_version' => '2026-11',

    // How long a log in may wait for its emailed code before it has to start again (docs/api-auth.md 2a).
    'login_code_window_minutes' => 15,

];
