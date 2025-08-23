import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions, ChartData } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  BarElement,
  ChartDataLabels,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const monthLabels = [
  "Jan", "Feb", "Mar", 
  "Apr", "May", "Jun", 
  "Jul", "Aug", //"Sep", 
  //"Oct", "Nov", "Dec"
];
const fixedProfits = [
  5.1, 3.1, 3.2, 
  3.4, 3.78, 5.0, 
  5.55, 4.1, 
];
const totalProfit = fixedProfits.reduce((sum, val) => sum + val, 0).toFixed(2);

const chartData: ChartData<'bar'> = {
  labels: monthLabels,
  datasets: [
    {
      label: `Total: ${totalProfit} %`,
      data: fixedProfits,
      borderColor: "rgb(75, 192, 192)",
      borderWidth: 1,
      backgroundColor: "#40E0D0",
    },
  ],
};

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      type: 'linear',
      beginAtZero: true,
      ticks: {
        callback: (value) => `${value}%`,
        color: 'black',
      },
    },
    x: {
      ticks: {
        color: 'black',
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y}%`,
      },
    },
    legend: {
      position: 'top',
      labels: {
        color: 'black',
      },
    },
    datalabels: {
      display: true,
      color: 'black',
      anchor: 'end',
      align: 'top',
      formatter: (value: number) => `${value}%`,
    },
  },
};

const PerformChart = () => {
  return (
    <div className="h-64 md:h-96 px-2 py-3 w-full flex flex-col items-center gap-2">
      <h6 className="font-semibold text-lg">-- 2025 Profit Trend --</h6>
      <Bar id="YearlyPerformanceChart" 
        data={chartData} 
        options={chartOptions} 
      />
    </div>
  );
};

export default PerformChart;
