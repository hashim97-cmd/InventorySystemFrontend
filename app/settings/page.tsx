'use client';

import NextAppShell from '../../src/components/NextAppShell';
import SettingsPage from '../../src/pages/SettingsPage';

export default function SettingsRoute() {
    return <NextAppShell page="settings"><SettingsPage /></NextAppShell>;
}
