'use client';

import Link from 'next/link';

interface InstallButtonsProps {
    className?: string;
    showWebApp?: boolean;
}

export function InstallButtons({ className = '', showWebApp = true }: InstallButtonsProps) {
    return (
        <div className={`flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center ${className}`}>
            {showWebApp && (
                <Link
                    href="/app"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 text-lg font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-lg hover:shadow-primary/25 btn-hover"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Open Web App
                </Link>
            )}

            {/* Download APK - GitHub Release */}
            <a
                href="https://github.com/HarshalKudale/lmhub/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-all btn-hover shadow-lg hover:shadow-green-600/25"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download APK
            </a>

            {/* Google Play Store - Coming Soon */}
            <button
                disabled
                className="inline-flex items-center gap-3 px-6 py-3 bg-background-secondary border border-border rounded-full opacity-60 cursor-not-allowed"
                title="Coming soon to Google Play"
            >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                </svg>
                <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wide text-foreground-muted">Coming Soon</div>
                    <div className="text-sm font-semibold text-foreground">Google Play</div>
                </div>
            </button>

            {/* Apple App Store - Coming Soon */}
            <button
                disabled
                className="inline-flex items-center gap-3 px-6 py-3 bg-background-secondary border border-border rounded-full opacity-60 cursor-not-allowed"
                title="Coming soon to App Store"
            >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wide text-foreground-muted">Coming Soon</div>
                    <div className="text-sm font-semibold text-foreground">App Store</div>
                </div>
            </button>
        </div>
    );
}
