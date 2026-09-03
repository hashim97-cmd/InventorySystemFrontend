'use client';

import NextAppShell from '../../src/components/NextAppShell';
import SettingsPage from '../../src/screens/SettingsPage';

export default function SettingsRoute() {
    return <NextAppShell page="settings"><SettingsPage /></NextAppShell>;
}
