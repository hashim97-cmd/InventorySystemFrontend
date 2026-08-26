import Providers from '../src/components/Providers';
import '../src/index.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html lang="ar" dir="rtl"><body><Providers>{children}</Providers></body></html>;
}
