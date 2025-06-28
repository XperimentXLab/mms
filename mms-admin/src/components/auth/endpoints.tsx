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


export const userDetails = async () => {
  const response = await api.get('/user_details/')
  return response.data
}

const activeMonth = new Date().toLocaleDateString('en-US', { month: 'numeric' });
const activeYear = new Date().toLocaleDateString('en-US', { year: 'numeric' })
export const get_profit = async () => {
  const response = await api.get('/manage_operational_profit/', {
    params: {
      active_month_profit: Number(activeMonth),
      active_year_profit: Number(activeYear)
    }
  })
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

export const update_monthly_finalized_profit = async (MonthlyProfitData: MonthlyProfitRes) => {
  const { month, year, finalizedProfit } = MonthlyProfitData
  const response = await api.put('/manage_monthly_finalized_profit/', {
    month,
    year,
    finalized_profit_rate: finalizedProfit
  })
  return response.data
}


export const distribute_profit = async () => {
  const response = await api.post('/distribute_profit/')
  return response.data
}

interface SetupUserRes {
  userID: string
  username: string
  masterAmount: number
  profitAmount: number
  affiliateAmount: number
}
export const setupUser = async (SetupUserData: SetupUserRes) => {
  const { userID, username, masterAmount, profitAmount, affiliateAmount } = SetupUserData
  const response = await api.post('/setup_user/', {
    user_id: userID,
    username,
    master_amount: masterAmount,
    profit_amount: profitAmount,
    affiliate_amount: affiliateAmount
  })
  return response.data
}


export const getPendingTX = async () => {
  const response = await api.get('/get_pending_transaction/')
  return response.data
}


export const updateProfitSharing = async (amount: number) => {
  const response = await api.put('/update_profit_sharing/', {
    amount
  })
  return response.data
}