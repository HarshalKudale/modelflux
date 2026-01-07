'use client';

const technologies = [
    {
        name: 'React Native',
        description: 'Cross-platform mobile development',
        color: '#61DAFB',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 9.861a2.139 2.139 0 100 4.278 2.139 2.139 0 100-4.278zm-5.992 6.394l-.472-.12C2.018 15.246 0 13.737 0 12s2.018-3.246 5.536-4.135l.472-.119.133.468a23.53 23.53 0 001.363 3.578l.101.213-.101.213a23.307 23.307 0 00-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.052 0 1.151 1.641 2.301 4.315 3.052a22.32 22.32 0 011.131-3.052 22.542 22.542 0 01-1.131-3.052zm12.675 7.305l-.133-.469a23.357 23.357 0 00-1.364-3.577l-.101-.213.101-.213a23.42 23.42 0 001.364-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.135s-2.018 3.246-5.535 4.135l-.473.12zm.491-4.259c.48 1.039.877 2.06 1.131 3.052 2.674-.752 4.315-1.901 4.315-3.052 0-1.152-1.641-2.301-4.315-3.052a22.296 22.296 0 01-1.131 3.052zm-5.073 8.413l-.364-.366a22.91 22.91 0 01-2.499-3.029l-.149-.209.149-.209a22.967 22.967 0 012.499-3.029l.364-.366.365.366a22.969 22.969 0 012.499 3.029l.148.209-.148.209a22.79 22.79 0 01-2.499 3.029l-.365.366zm-.994-3.604a21.959 21.959 0 001.358 1.778 21.894 21.894 0 001.358-1.778 21.887 21.887 0 00-1.358-1.778 21.952 21.952 0 00-1.358 1.778zM8.293 7.636L7.78 7.17l.365-.366A22.91 22.91 0 0110.644 3.775l.364-.366.365.366a22.858 22.858 0 012.498 3.029l.149.209-.149.209a22.99 22.99 0 01-2.498 3.029l-.365.366-.365-.366a22.858 22.858 0 01-2.499-3.029l-.148-.209.148-.209.149.423zm4.048-.87a21.894 21.894 0 00-1.358-1.778 21.959 21.959 0 00-1.358 1.778c.452.609.9 1.196 1.358 1.778a21.887 21.887 0 001.358-1.778z" />
            </svg>
        ),
    },
    {
        name: 'Expo',
        description: 'Universal React applications',
        color: '#000020',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M0 20.084c.043.53.23 1.063.718 1.778.58.849 1.576 1.315 2.399.882.241-.127 5.369-7.006 8.037-10.559.238-.317.238-.317.465-.003 2.863 3.961 7.636 10.404 7.881 10.562.823.433 1.82-.033 2.4-.882.487-.715.674-1.248.717-1.778 0 0 .006-.166-.008-.214-.055-.205-.993-1.653-4.64-6.633L12.009 5.276l-5.97 7.968c-3.647 4.98-4.584 6.428-4.64 6.633-.013.048-.007.214-.007.214z" />
            </svg>
        ),
    },
    {
        name: 'ExecuTorch',
        description: 'On-device AI by Meta',
        color: '#0668E1',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15v-4H8l5-8v4h3l-5 8z" />
            </svg>
        ),
    },
    {
        name: 'Llama.cpp',
        description: 'GGUF model inference',
        color: '#FF6B35',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ),
    },
    {
        name: 'WatermelonDB',
        description: 'High-performance local database',
        color: '#2ECC71',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm6 12c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-4c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V13zm0-4c0 .5-2.13 2-6 2s-6-1.5-6-2V6.77c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V9z" />
            </svg>
        ),
    },
    {
        name: 'Zustand',
        description: 'State management',
        color: '#764ABC',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
        ),
    },
    {
        name: 'AI SDK',
        description: 'Vercel AI SDK for providers',
        color: '#000000',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
        ),
    },
    {
        name: 'TypeScript',
        description: 'Type-safe development',
        color: '#3178C6',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 011.306.34v2.458a3.95 3.95 0 00-.643-.361 5.093 5.093 0 00-.717-.26 5.453 5.453 0 00-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 00-.623.242c-.17.104-.3.229-.393.374a.888.888 0 00-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 01-1.012 1.085 4.38 4.38 0 01-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 01-1.84-.164 5.544 5.544 0 01-1.512-.493v-2.63a5.033 5.033 0 003.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 00-.074-1.089 2.12 2.12 0 00-.537-.5 5.597 5.597 0 00-.807-.444 27.72 27.72 0 00-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 011.47-.629 7.536 7.536 0 011.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" />
            </svg>
        ),
    },
];

export function Technologies() {
    return (
        <section id="technologies" className="py-24 bg-background-secondary px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground animate-fade-in-up">
                        Built With Modern Tech
                    </h2>
                    <p className="text-xl text-foreground-secondary max-w-2xl mx-auto animate-fade-in-up stagger-1">
                        Powered by cutting-edge technologies for performance, privacy, and developer experience.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {technologies.map((tech, idx) => (
                        <div
                            key={tech.name}
                            className={`glass p-6 rounded-2xl text-center hover-card animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
                        >
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${tech.color}20`, color: tech.color }}
                            >
                                {tech.icon}
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">{tech.name}</h3>
                            <p className="text-sm text-foreground-secondary">{tech.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
