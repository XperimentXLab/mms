import api from "./api"

interface LoginRes {
  username: string
  password: string
  recaptchaToken: string
}

interface ProfitRes {
  dailyProfitRate?: number
  weeklyProfitRate?: number
  currentMonthProfit?: number
  activeMonthProfit?: number | null;
  activeYearProfit?: number | null;
}

interface MonthlyProfitRes {
  month?: number
  year?: number
  finalizedProfit?: number
}


export const protectedView = async () => {
  const response = await api.get('/protected/')
  return response.data
}

export const login = async (loginData: LoginRes) => {
  const { username, password, recaptchaToken } = loginData
  const response = await api.post('/login_admin/', {
    username, password, recaptchaToken
  })
  return response.data
}

export const logout = async () => {
  const response = await api.post('/logout/')
  return response.data
}

export const get_profit = async () => {
  const response = await api.get('/manage_operational_profit/')
  return response.data
}

export const create_profit = async (profitData: ProfitRes) => {
  const { 
    activeMonthProfit, 
    activeYearProfit
  } = profitData
  const response = await api.post('/manage_operational_profit/', {
    active_month_profit: activeMonthProfit,
    active_year_profit: activeYearProfit,
  })
  return response.data
}

export const update_profit = async (profitData: ProfitRes) => {
  const { 
    dailyProfitRate, 
    weeklyProfitRate,
    currentMonthProfit,
    activeMonthProfit, 
    activeYearProfit
  } = profitData
  const response = await api.put('/manage_operational_profit/', {
    daily_profit_rate: dailyProfitRate, 
    weekly_profit_rate: weeklyProfitRate, 
    current_month_profit: currentMonthProfit,
    active_month_profit: activeMonthProfit,
    active_year_profit: activeYearProfit,
  })
  return response.data
}

export const create_monthly_finalized_profit = async (MonthlyProfitData: MonthlyProfitRes) => {
  const { month, year, finalizedProfit } = MonthlyProfitData
  const response = await api.post('/manage_monthly_finalized_profit/', {
    month,
    year,
    finalized_profit_rate: finalizedProfit
  })
  return response.data
}
