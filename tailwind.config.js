/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                theme: {
                    retro: {
                        bg: '#f4ecd8', // 大航海羊皮纸
                        border: '#5c4033', // 墨水钢笔线条
                        heat0: '#f4ecd8',
                        heat1: '#d2b48c',
                        heat2: '#a0522d',
                        heat3: '#800000'
                    },
                    watercolor: {
                        bg: '#e0f7fa', // 绘本水彩蓝
                        border: '#afb42b', // 彩色蜡笔
                        heat0: '#ffffff',
                        heat1: '#fff59d',
                        heat2: '#ffb74d',
                        heat3: '#e64a19'
                    }
                }
            },
            fontFamily: {
                'handwriting': ['"Indie Flower"', '"Comic Sans MS"', 'cursive'], // 测试手写体
                'serif': ['"Playfair Display"', 'Georgia', 'serif'],
                'sans': ['"Inter"', 'system-ui', 'sans-serif'] // 主体内容字体
            },
            keyframes: {
                'slide-left': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' }
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'ethereal': {
                    '0%, 100%': { opacity: '0.1' },
                    '50%': { opacity: '0.5' }
                },
                'pan-ken-burns': {
                    '0%, 100%': { transform: 'scale(1.05) translate(-1%, -1%)' },
                    '50%': { transform: 'scale(1) translate(0, 0)' }
                }
            },
            animation: {
                'slide-left': 'slide-left 0.1s linear',
                'fade-up': 'fade-up 0.5s ease-out',
                'ethereal': 'ethereal 4s ease-in-out infinite',
                'pan-ken-burns': 'pan-ken-burns 30s ease-in-out infinite'
            }
        },
    },
    plugins: [],
}
