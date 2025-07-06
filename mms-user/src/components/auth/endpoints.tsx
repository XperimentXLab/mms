
import api, { generateDeviceFingerprint } from "./api";


interface User {
  user_id?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  ic?: string;
  password: string;
  referredBy?: string;
  addressLine?: string | undefined;
  state?: string | undefined;
  city?: string | undefined;
  postcode?: string | undefined;
  country?: string | undefined;
  walletAddress?: string | undefined;
  beneficiaryName?: string | undefined;
  beneficiaryIc?: string | undefined;
  beneficiaryRelationship?: string | undefined;
  beneficiaryEmail?: string | undefined;
  beneficiaryPhone?: string | undefined;
  verificationStatus?: string | undefined;
  ic_document_url?: string | undefined
}

interface updatePassData {
  oldPassword: string;
  newPassword: string;
  newConfirmPassword: string;
}

interface LoginDataRes {
  username: string
  password: string
  //recaptchaToken: string
}

type AuthTokens = {
  access: string
  refresh: string
}

interface PasswordResetConfirmDataRes {
  uidb64?: string
  token?: string
  password: string;
  password2: string;
}

export const reset_password_request = async (email: string) => {
  const response = await api.post('/password_reset/', {email: email})
  return response.data
}

export const reset_password_confirm = async (DataConfirm: PasswordResetConfirmDataRes) => {
  const { uidb64, token, password, password2 } = DataConfirm
  const response = await api.post(`/password_reset_confirm/${uidb64}/${token}/`, {
    password, password2
  })
  return response.data
}

export const register = async (userData: User) => {
  const { username, email, ic, password, referredBy, firstName, lastName } = userData
  const response = await api.post('/register/', {
    username,
    email,
    first_name: firstName,
    last_name: lastName,
    ic,
    password,
    referred_by: referredBy
  })
  return response.data
}

export const login = async (loginData: LoginDataRes): Promise<AuthTokens> => {
  const fingerprint = generateDeviceFingerprint?.()

  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (fingerprint) {
    headers['X-Device-Fingerprint'] = fingerprint;
  }

  try {
    const { username, password, /*recaptchaToken*/ } = loginData
    const response = await api.post('/login/', {
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


export const updatePassword = async (passwordData: updatePassData) => {
  const { oldPassword, newPassword, newConfirmPassword} = passwordData
  const response = await api.post(`/update_password/`, {
    old_password: oldPassword,
    new_password: newPassword,
    confirm_password: newConfirmPassword
  })
  return response.data
}

export const userDetails = async () => {
  const response = await api.get(`/user_details/`)
  return response.data
}

export const getUsername = async () => {
  const response = await api.get('/user_username/')
  return response.data
}

export const userNetwork = async () => {
  const response = await api.get(`/user_network/`)
  return response.data
}


export const updateUserDetails = async (userData: Partial<User>) => {
  const {
    addressLine,
    state,
    city,
    postcode,
    country,
    walletAddress,
    beneficiaryName,
    beneficiaryIc,
    beneficiaryRelationship,
    beneficiaryEmail,
    beneficiaryPhone, 
    verificationStatus,
    ic_document_url,
   } = userData
  const response = await api.put(`/update_user/`, {
    address_line: addressLine,
    address_state: state,
    address_city: city,
    address_postcode: postcode,
    address_country: country,
    wallet_address: walletAddress,
    beneficiary_name: beneficiaryName,
    beneficiary_ic: beneficiaryIc,
    beneficiary_relationship: beneficiaryRelationship,
    beneficiary_email: beneficiaryEmail,
    beneficiary_phone: beneficiaryPhone,
    verification_status: verificationStatus,
    ic_document_url
  })
  return response.data
}


const activeMonth = new Date().toLocaleDateString('en-US', { month: 'numeric' });
const activeYear = new Date().toLocaleDateString('en-US', { year: 'numeric' })
export const getProfit = async () => {
  const response = await api.get('/manage_operational_profit/', {
    params: {
      active_month_profit: Number(activeMonth),
      active_year_profit: Number(activeYear)
    }
  })
  return response.data
}

export interface FinalizedMonthlyProfit {
  id?: number; 
  month: number; // e.g., 1 for January
  year: number;
  finalized_profit_rate: number; 
}

export const getFinalizedYearlyProfits = async (year: number): Promise<FinalizedMonthlyProfit[]> => {
  const response = await api.get('/manage_monthly_finalized_profit/', { params: { year } });
  return response.data;
}

export const getProfitStatement = async () => {
  const response = await api.get('/user_profit_tx/')
  return response.data
}

export const getCommissionStatement = async () => {
  const response = await api.get('/user_commission_tx/')
  return response.data
}

export const getTransferStatement = async () => {
  const response = await api.get('/user_transfer_tx/')
  return response.data
}

export const getConvertStatement = async () => {
  const response = await api.get('/user_convert_tx/')
  return response.data
}

export const getProfitCommissionWDStatement = async () => {
  const response = await api.get('/user_profit_commission_wd_tx/')
  return response.data
}

export const getAssetStatement = async () => {
  const response = await api.get('/user_asset_tx/')
  return response.data
}

export const getWallet = async () => {
  const response = await api.get('/user_wallet/')
  return response.data
}

export const getAsset = async () => {
  const response = await api.get('/user_asset/')
  return response.data
}

export const getDepositLock = async () => {
  const response = await api.get('/user_deposit_lock/')
  return response.data
}

export const getDailyTotalProfit = async () => {
  const response = await api.get('/user_daily_total_profit/')
  return response.data
}


interface TransferMasterData {
  amount: number
  receiver: string  // This should be the username of the receiver
  reference?: string
}

export const transferMasterPoint = async (transferMasterData: TransferMasterData) => {
  const { amount, receiver, reference } = transferMasterData
  const response = await api.post('/transfer_master_to_user/', {
    amount, receiver, reference
  })
  return response.data
}


interface TransData {
  amount: number
  reference?: string
}

export const convertProfitToMaster = async (convertProfitData: TransData) => {
  const { amount, reference } = convertProfitData
  const response = await api.post('/convert_profit/', {
    amount, reference
  })
  return response.data
}

export const convertCommissionToMaster = async (convertCommissionData: TransData) => {
  const { amount, reference } = convertCommissionData
  const response = await api.post('/convert_commission/', {
    amount, reference
  })
  return response.data
}

export const depositMaster = async (depositMasterData: TransData) => {
  const { amount, reference } = depositMasterData
  const response = await api.post('/deposit_master/', {
    amount, reference
  })
  return response.data
}

////////////////////// Need admin approval ////////////////////////

export const placeAsset = async (placeAssetData: TransData) => {
  const { amount, reference } = placeAssetData
  const response = await api.post('/place_asset/', {
    amount, reference
  })
  return response.data
}

export const withdrawProfit = async (withdrawProfitData: TransData) => {
  const { amount, reference } = withdrawProfitData
  const response = await api.post('/withdraw_profit/', {
    amount, reference
  })
  return response.data
}

export const withdrawCommission = async (withdrawCommissionData: TransData) => {
  const { amount, reference } = withdrawCommissionData
  const response = await api.post('/withdraw_commission/', {
    amount, reference
  })
  return response.data
}

export const withdrawAsset = async (withdrawAssetData: TransData) => {
  const { amount, reference } = withdrawAssetData
  const response = await api.post('/withdraw_asset/', {
    amount, reference
  })
  return response.data
}
