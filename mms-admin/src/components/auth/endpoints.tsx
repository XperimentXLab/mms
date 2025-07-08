import api, { generateDeviceFingerprint } from "./api"

interface LoginRes {
  username: string
  password: string
  //recaptchaToken: string
}

type AuthTokens = {
  access: string
  refresh: string
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


export const login = async (loginData: LoginRes): Promise<AuthTokens> => {
  const fingerprint = generateDeviceFingerprint?.()

  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (fingerprint) {
    headers['X-Device-Fingerprint'] = fingerprint;
  }

  try {
    const { username, password, /*recaptchaToken*/ } = loginData
    const response = await api.post('/login_admin/', {
      username, password, //recaptchaToken
    }, { headers })

    const { access, refresh } = response.data
    sessionStorage.setItem('access_token', access)
    sessionStorage.setItem('refresh_token', refresh)
    
    return { access, refresh }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export const logout = async (): Promise<void> => {
  try {  
    const accessToken = sessionStorage.getItem('access_token');
    const response = await api.post('/logout/',
      {},
      { 
        headers: { 
          Authorization: `Bearer ${accessToken}` 
        } 
      }
    )

    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    api.defaults.headers.common['Authorization'] = ''
    return response.data

  } catch (e) {
    console.error(e)
    throw e
  }
}


export const getUsername = async () => {
  const response = await api.get('/user_username/')
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


export const getAllUsers = async () => {
  const response = await api.get('/all_users/')
  return response.data
}


interface processPlaceAssetRes {
  tx_id: string
  action: string
}
export const processPlaceAsset = async (dataRes: processPlaceAssetRes) => {
  const { tx_id, action } = dataRes
  const response = await api.post('/process_place_asset/',{
    transaction_id: tx_id,
    action
  })
  return response.data
}


export const resetAllWalletBalances = async () => {
  const response = await api.post('/reset_all_wallet_balances/')
  return response.data
}


interface processVeriRes {
  user_id: string
  action: string
  reject_reason?: string
}
export const processVeri = async (data: processVeriRes) => {
  const { user_id, action, reject_reason } = data;
  const payload: any = { user_id, action };
  if (reject_reason !== undefined) {
    payload.reject_reason = reject_reason;
  }

  const response = await api.post('/process_verification/', payload);
  return response.data;
};



export const grantFreeCampro = async (user_id: string) => {
  const response = await api.post('/grant_campro/',{
    user_id
  })
  return response.data
}


export const getAllTransactions = async () => {
  const response = await api.get('/all_transactions/')
  return response.data
}

export const getAllMasterTX = async () => {
  const response = await api.get('/all_master_tx/')
  return response.data
}

export const getAllProfitTX = async () => {
  const response = await api.get('/all_profit_tx/')
  return response.data
}

export const getAllCommissionTX = async () => {
  const response = await api.get('/all_commission_tx/')
  return response.data
}

export const getAllAssetTX = async () => {
  const response = await api.get('/all_asset_tx/')
  return response.data
}


export const getInfoDashboard = async () => {
  const response = await api.get('/get_info_dashboard/')
  return response.data
}


export const getPerformance = async () => {
  const repsonse = await api.get('/manage_performance/')
  return repsonse.data
}

interface PerformanceData {
  totalDeposit: number
  totalGainZ: number
  totalGainA: number
  mode: string
}
export const putPerformance = async (data: PerformanceData) => {
  const { totalDeposit, totalGainZ, totalGainA, mode } = data
  const response = await api.put('/manage_performance/', {
    total_deposit: totalDeposit,
    total_gain_z: totalGainZ,
    total_gain_a: totalGainA,
    mode
  })
  return response.data
}


export const getWDReq = async () => {
  const response = await api.get('/all_withdrawal_requests/')
  return response.data
}

interface processWDRes {
  tx_id: string
  action: string
  reference?: string
}
export const processWDAsset = async (data: processWDRes) => {
  const { tx_id, action, reference } = data
  const response = await api.post('/process_withdrawal_asset/',{
    transaction_id: tx_id,
    action,
    reference,
  })
  return response.data
} 

export const processWDProfit = async (data: processWDRes) => {
  const { tx_id, action, reference } = data
  const response = await api.post('/process_withdrawal_profit/',{
    transaction_id: tx_id,
    action,
    reference,
  })
  return response.data
}

export const processWDCommission = async (data: processWDRes) => {
  const {  tx_id, action, reference } = data
  const response = await api.post('/process_withdrawal_commission/',{
    request_id: tx_id,
    action,
    reference,
  })
  return response.data
}