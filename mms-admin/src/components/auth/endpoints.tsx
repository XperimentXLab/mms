
import type { TableFetchParams } from "../props/Tables"
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
  activeDayProfit?: number | null;
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
const activeDay = new Date().toLocaleDateString('en-US', { day: 'numeric' });
export const get_profit = async (profitData: ProfitRes) => {
  const { 
    activeMonthProfit, 
    activeYearProfit,
    activeDayProfit
  } = profitData
  const response = await api.get('/manage_operational_profit/', {
    params: {
      active_day_profit: activeDayProfit || Number( activeDay),
      active_month_profit: activeMonthProfit || Number(activeMonth),
      active_year_profit: activeYearProfit || Number(activeYear)
    }
  })
  return response.data
}

export const create_profit = async (profitData: ProfitRes) => {
  const { 
    activeMonthProfit, 
    activeYearProfit,
    activeDayProfit
  } = profitData
  const response = await api.post('/manage_operational_profit/', {
    active_month_profit: activeMonthProfit,
    active_year_profit: activeYearProfit,
    active_day_profit: activeDayProfit,
  })
  return response.data
}

export const update_profit = async (profitData: ProfitRes) => {
  const { 
    dailyProfitRate, 
    weeklyProfitRate,
    currentMonthProfit,
    activeMonthProfit, 
    activeYearProfit,
    activeDayProfit,
  } = profitData
  const response = await api.put('/manage_operational_profit/', {
    daily_profit_rate: dailyProfitRate, 
    weekly_profit_rate: weeklyProfitRate, 
    current_month_profit: currentMonthProfit,
    active_day_profit: activeDayProfit,
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

interface updateUserInfoRes {
  userID: string
  firstName?: string
  lastName?:string
  ic?: string
}
export const getUserInfo = async (data: updateUserInfoRes) => {
  const { userID } = data
  const response = await api.get('/get_user_info/', {
    params: {
      user_id: userID
    }
  })
  return response.data
}
export const updateUserInfo = async (data: updateUserInfoRes) => {
  const { userID, firstName, lastName, ic } = data
  const response = await api.put('/update_user_info/',{
    user_id: userID,
    first_name: firstName,
    last_name: lastName,
    ic
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


export type dataParams = TableFetchParams
export const getAllUsers = async (params: dataParams) => {
  const {
    startDate,
    endDate,
    search,
    status,
    isCampro,
    month,
    year,
    page = 1,
    pageSize,
  } = params
  const queryParams =  new URLSearchParams()
  if (startDate && endDate) {
    queryParams.append('start_date', startDate)
    queryParams.append('end_date', endDate)
  }
  if (search) {
    queryParams.append('search', search)
  }
  if (month && year) {
    queryParams.append('month', month.toString())
    queryParams.append('year', year.toString())
  }
  if (status) {
    queryParams.append('status', status)
  }
  if (isCampro) {
    queryParams.append('is_campro', isCampro)
  }
  if (pageSize) {
    queryParams.append('page_size', pageSize.toString())
  }
  queryParams.append('page', page.toString())

  const response = await api.get(`/all_users/?${queryParams.toString()}`)
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

export type rangeTypeT = 'month' | 'year' | '3month' | ''
interface paramsTx {
  search?: string,
  status?: string,
  transactionType?: string,
  pointType?: string,
  startDate?: string,
  endDate?: string,
  page?: number,
  pageSize?: number,
  rangeType?: rangeTypeT,
  month?: number,
  year?: number,
}
export const getAllTransactions = async ( params: paramsTx) => {
  const { 
    search, 
    status, 
    transactionType, 
    startDate, 
    pointType,
    endDate, 
    page=1, 
    pageSize=30,
    rangeType,
    month,
    year
  } = params
  const queryParams = new URLSearchParams();
  if (search) {
    queryParams.append('search', search);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (transactionType) {
    queryParams.append('transaction_type', transactionType);
  }
  if (startDate) {
    queryParams.append('start_date', startDate);
  }
  if (endDate) {
    queryParams.append('end_date', endDate);
  }

  if (pointType) {
    queryParams.append('point_type', pointType)
  }

  queryParams.append('range_type', rangeType || '');
  if (rangeType === 'month' && month && year) {
    queryParams.append('month', month.toString());
    queryParams.append('year', year.toString());
  }
  if (rangeType === 'year') {
    queryParams.append('year', (year || '').toString());
  }
  if (rangeType === '3month') {
    queryParams.append('range_type', '3month');
  }

  queryParams.append('page', page.toString());
  queryParams.append('page_size', pageSize.toString());

  const response = await api.get(`/all_transactions/?${queryParams.toString()}`)
  return response.data
}


interface infoDash {
  year: number
}
export const getInfoDashboard = async (data: infoDash) => {
  const { year=2025 } = data
  const response = await api.get('/get_info_dashboard/', {
    params: {
      year
    }
  })
  console.log(response.data.monthly_data)
  return response.data
}


export const getPerformance = async () => {
  const repsonse = await api.get('/manage_performance/')
  return repsonse.data
}

interface PerformanceData {
  totalDeposit?: number
  totalGainZ?: number
  totalGainA?: number
  month: number
  year: number
}
export const putPerformance = async (data: PerformanceData) => {
  const response = await api.patch('/manage_performance/', {
    total_deposit: data.totalDeposit,
    total_gain_z: data.totalGainZ,
    total_gain_a: data.totalGainA,
    month: data.month,
    year: data.year
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


/*
import FileSaver from 'file-saver';

export const downloadExcel = async () => {
  try {
    const response = await api.get('/api/export-excel/', {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    FileSaver.saveAs(blob, 'data.xlsx');
  } catch (error) {
    console.error('Excel download failed:', error);
  }
}

call downloadExcel() from a button

For production, configure Nginx or your server to handle media/static files properly.
*/
