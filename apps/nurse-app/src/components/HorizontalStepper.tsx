import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

interface StepItem {
    title: string;
}

interface HorizontalStepperProps {
    steps: StepItem[];
    current: number; // 0-based
    visibleCount?: number; // default 3
}

const circleSize = 30;

const HorizontalStepper: React.FC<HorizontalStepperProps> = ({ steps, current, visibleCount = 3 }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [itemWidth, setItemWidth] = useState<number>(140);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // 计算窗口起点：尽量让当前步骤靠右，形成“向右滚动”的观感
    const startIndex = useMemo(() => {
        const maxStart = Math.max(0, steps.length - visibleCount);
        return clamp(current - (visibleCount - 1), 0, maxStart);
    }, [current, steps.length, visibleCount]);

    useLayoutEffect(() => {
        const recalc = () => {
            const el = containerRef.current;
            if (!el) return;
            const w = el.offsetWidth;
            if (w > 0) setItemWidth(Math.floor(w / visibleCount));
        };
        recalc();
        window.addEventListener('resize', recalc);
        return () => window.removeEventListener('resize', recalc);
    }, [visibleCount]);

    const primary = '#294db5';
    const primaryLight = 'rgba(41,77,181,0.15)';

    const trackStyle: React.CSSProperties = {
        display: 'flex',
        transform: `translateX(-${startIndex * itemWidth}px)`,
        transition: 'transform 360ms ease',
    };

    return (
        <div ref={containerRef} style={{ overflow: 'hidden', width: '100%' }}>
            <div style={trackStyle}>
                {steps.map((step, index) => {
                    const isDone = index < current;
                    const isActive = index === current;
                    const isLast = index === steps.length - 1;
                    const lineHeight = 4;
                    // 与当前数字、后一个数字的间隔（同时考虑外环的视觉占位）
                    const gapLeft = 14;  // 当前数字右侧留白
                    const gapRight = 20; // 下一个数字左侧留白
                    const rightWidth = Math.max(24, itemWidth - circleSize - gapLeft - gapRight);

                    return (
                        <div key={index} style={{ width: itemWidth, padding: '0 8px', boxSizing: 'border-box' }}>
                            <div style={{ position: 'relative', height: circleSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div
                                    style={{
                                        width: circleSize,
                                        height: circleSize,
                                        borderRadius: circleSize / 2,
                                        background: isActive || isDone ? primary : primaryLight,
                                        boxShadow: `0 0 0 3px ${isActive || isDone ? primaryLight : 'rgba(0,0,0,0.04)'}`,
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        transition: 'all .2s ease'
                                    }}
                                >
                                    {index + 1}
                                </div>
                                {!isLast && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: `calc(50% + ${circleSize / 2 + gapLeft}px)`,
                                            top: (circleSize - lineHeight) / 2,
                                            width: rightWidth,
                                            height: lineHeight,
                                            background: isDone ? primary : '#cfd3dc',
                                            borderRadius: 2,
                                        }}
                                    />
                                )}
                            </div>
                            <div
                                style={{
                                    fontSize: 15,
                                    color: isActive || isDone ? primary : '#2b3a67',
                                    fontWeight: isActive ? 700 : 500,
                                    textAlign: 'center',
                                    marginTop: 6,
                                    maxWidth: '100%',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                                title={step.title}
                            >
                                {step.title}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HorizontalStepper;


