
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { format, subDays, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

interface StockHistoryChartProps {
    tickers: string[];
    data?: {
        [key: string]: { date: string; price: number }[];
    };
}

const chartConfig = {
    price: {
        label: "Precio USD",
        color: "hsl(var(--primary))",
    },
    volume: {
        label: "Volumen",
        color: "hsl(var(--muted-foreground))",
    },
} satisfies ChartConfig

// Función para generar datos históricos simulados realistas
const generateRealisticHistoricalData = (ticker: string, period: string) => {
    const now = new Date();
    let startDate: Date;
    let dataPoints: number;
    
    switch (period) {
        case '1m':
            startDate = subMonths(now, 1);
            dataPoints = 30;
            break;
        case '6m':
            startDate = subMonths(now, 6);
            dataPoints = 180;
            break;
        case '1y':
            startDate = subYears(now, 1);
            dataPoints = 365;
            break;
        default: // 3m
            startDate = subMonths(now, 3);
            dataPoints = 90;
    }
    
    // Precios base realistas por ticker
    const basePrices: { [key: string]: number } = {
        'AAPL': 175,
        'MSFT': 380,
        'GOOGL': 140,
        'AMZN': 155,
        'TSLA': 250,
        'NVDA': 875,
        'META': 485,
        'NFLX': 450,
        'ASML': 785,
        'TSM': 105,
        'V': 265,
        'WMT': 165,
        'JPM': 175,
        'JNJ': 155,
        'PG': 165,
        'UNH': 525,
        'HD': 385,
        'MA': 465,
        'BAC': 42,
        'ABBV': 175,
        'CRM': 285,
        'KO': 62,
        'PEP': 175,
        'COST': 875,
        'AVGO': 1650,
        'LLY': 785,
        'TMO': 525,
        'ACN': 365,
        'CSCO': 55,
        'ABT': 115,
        'CVX': 165,
        'MRK': 125,
        'ADBE': 485,
        'TXN': 185,
        'QCOM': 165,
        'DHR': 245,
        'NEE': 75,
        'CMCSA': 42,
        'VZ': 42,
        'PFE': 28,
        'INTC': 25,
        'COP': 115,
        'PM': 105,
        'RTX': 115,
        'SPGI': 445,
        'HON': 215,
        'UNP': 245,
        'GS': 445,
        'IBM': 185,
        'CAT': 365,
        'AXP': 245,
        'DE': 445,
        'SYK': 325,
        'BLK': 825,
        'GE': 165,
        'MMM': 125,
        'MDT': 85,
        'TJX': 115,
        'SCHW': 75,
        'AMT': 215,
        'PLD': 135,
        'C': 65,
        'CB': 245,
        'SO': 75,
        'DUK': 105,
        'BSX': 75,
        'ZTS': 185,
        'AON': 325,
        'SHW': 325,
        'CME': 215,
        'ICE': 145,
        'PNC': 165,
        'USB': 45,
        'COF': 145,
        'TFC': 42,
        'AIG': 75,
        'MET': 75,
        'PRU': 115,
        'ALL': 165,
        'TRV': 225,
        'AMP': 385,
        'AFL': 85,
        'HUM': 445,
        'CI': 325,
        'CVS': 65,
        'WBA': 25,
        'MCK': 485,
        'CNC': 75,
        'ANTM': 485,
        'UHS': 145,
        'DGX': 125,
        'LH': 225,
        'A': 145,
        'IQV': 225,
        'RMD': 225,
        'DXCM': 85,
        'IDXX': 485,
        'MTD': 325,
        'ILMN': 145,
        'REGN': 885,
        'VRTX': 425,
        'GILD': 85,
        'BIIB': 245,
        'AMGN': 285,
    };
    
    const basePrice = basePrices[ticker] || 100;
    const data = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < dataPoints; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (i * (period === '1y' ? 1 : period === '6m' ? 1 : period === '3m' ? 1 : 1)));
        
        // Simulación de volatilidad realista
        const volatility = ticker === 'TSLA' ? 0.04 : ticker === 'NVDA' ? 0.035 : ticker === 'AAPL' ? 0.02 : 0.025;
        const change = (Math.random() - 0.5) * volatility;
        const trend = ticker === 'NVDA' ? 0.0008 : ticker === 'AAPL' ? 0.0005 : ticker === 'TSLA' ? 0.0003 : 0.0002;
        
        currentPrice = currentPrice * (1 + change + trend);
        
        // Asegurar que el precio no sea negativo
        currentPrice = Math.max(currentPrice, basePrice * 0.5);
        
        data.push({
            date: date.toISOString().split('T')[0],
            price: Number(currentPrice.toFixed(2)),
            volume: Math.floor(Math.random() * 10000000) + 1000000,
        });
    }
    
    return data;
};

// Función para calcular métricas de rendimiento
const calculateMetrics = (data: { date: string; price: number }[]) => {
    if (data.length < 2) return { change: 0, changePercent: 0, high: 0, low: 0, volatility: 0 };
    
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    const prices = data.map(d => d.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    
    // Calcular volatilidad (desviación estándar de los cambios porcentuales)
    const returns = [];
    for (let i = 1; i < data.length; i++) {
        returns.push((data[i].price - data[i-1].price) / data[i-1].price);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Anualizada
    
    return { change, changePercent, high, low, volatility };
};

export function StockHistoryChart({ tickers, data = {} }: StockHistoryChartProps) {
    // Eliminar duplicados del array de tickers
    const uniqueTickers = React.useMemo(() => {
        return Array.from(new Set(tickers.filter(Boolean)));
    }, [tickers]);
    
    const [selectedTicker, setSelectedTicker] = React.useState(uniqueTickers[0] || 'AAPL');
    const [selectedPeriod, setSelectedPeriod] = React.useState('3m');
    
    // Generar datos históricos si no se proporcionan
    const chartData = React.useMemo(() => {
        if (data[selectedTicker] && data[selectedTicker].length > 0) {
            return data[selectedTicker];
        }
        return generateRealisticHistoricalData(selectedTicker, selectedPeriod);
    }, [data, selectedTicker, selectedPeriod]);
    
    const metrics = React.useMemo(() => {
        return calculateMetrics(chartData);
    }, [chartData]);
    
    const isPositive = metrics.changePercent >= 0;
    
    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Histórico de Precios
                    </CardTitle>
                    <CardDescription>Tendencias de tus activos</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Acción" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueTickers.map((ticker, index) => (
                                <SelectItem key={`${ticker}-${index}`} value={ticker}>
                                    {ticker}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Rango" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1m">1 Mes</SelectItem>
                            <SelectItem value="3m">3 Meses</SelectItem>
                            <SelectItem value="6m">6 Meses</SelectItem>
                            <SelectItem value="1y">1 Año</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            
            {/* Métricas de rendimiento */}
            <div className="px-6 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Cambio</p>
                        <div className="flex items-center gap-1">
                            {isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`font-semibold ${
                                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                                {isPositive ? '+' : ''}{metrics.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Máximo</p>
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">${metrics.high.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Mínimo</p>
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">${metrics.low.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Volatilidad</p>
                        <Badge variant={metrics.volatility > 30 ? 'destructive' : metrics.volatility > 20 ? 'secondary' : 'default'}>
                            {metrics.volatility.toFixed(1)}%
                        </Badge>
                    </div>
                </div>
            </div>
            
            <CardContent className="pt-0">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                            bottom: 12,
                        }}
                    >
                        <CartesianGrid 
                            vertical={false} 
                            strokeDasharray="3 3" 
                            className="stroke-muted-foreground/20"
                        />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            interval="preserveStartEnd"
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return format(date, selectedPeriod === '1y' ? "MMM yy" : "dd MMM", { locale: es });
                            }}
                            className="text-xs"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickCount={6}
                            domain={['dataMin - 5', 'dataMax + 5']}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                            className="text-xs"
                        />
                        <ChartTooltip 
                            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="rounded-lg border bg-background p-3 shadow-md">
                                            <p className="text-sm font-medium">
                                                {format(new Date(label), "dd 'de' MMMM, yyyy", { locale: es })}
                                            </p>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-sm text-muted-foreground">Precio:</span>
                                                    <span className="font-semibold">${data.price.toFixed(2)}</span>
                                                </div>
                                                {data.volume && (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-sm text-muted-foreground">Volumen:</span>
                                                        <span className="text-sm">{(data.volume / 1000000).toFixed(1)}M</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <defs>
                            <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="price"
                            type="monotone"
                            fill="url(#fillPrice)"
                            stroke={isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ 
                                r: 4, 
                                stroke: isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
                                strokeWidth: 2,
                                fill: "hsl(var(--background))"
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
