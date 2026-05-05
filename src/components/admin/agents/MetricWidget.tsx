import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface MetricWidgetProps {
    title: string;
    value: string | number;
    trend: string;
    isPositive: boolean;
    icon: React.ReactNode;
    data: any[];
    color?: string;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({ title, value, trend, isPositive, icon, data, color = '#FFB800' }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border-subtle p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 rounded-2xl bg-bg-base border border-border-subtle text-text-primary group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase border ${
                    isPositive 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {trend}
                </div>
            </div>

            <p className="text-xs font-bold text-text-tertiary uppercase tracking-[0.1em] mb-1">{title}</p>
            <h3 className="text-2xl font-black text-text-primary tracking-tight">{value}</h3>

            <div className="h-16 w-[120%] -ml-6 -mb-6 mt-4 opacity-50 group-hover:opacity-100 transition-opacity" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                                <stop offset="100%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={color} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill={`url(#grad-${title})`} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};
