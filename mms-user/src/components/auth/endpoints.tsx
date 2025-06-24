
import api from "./api";


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
  bineficiaryName?: string | undefined;
  bineficiaryIc?: string | undefined;
  bineficiaryRelationship?: string | undefined;
  bineficiaryEmail?: string | undefined;
  bineficiaryPhone?: string | undefined;
  verificationStatus?: string | undefined;
}

interface updatePassData {
  oldPassword: string;
  newPassword: string;
  newConfirmPassword: string;
}

interface LoginDataRes {
  username: string
  password: string
  recaptchaToken: string
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

export const login = async (loginData: LoginDataRes) => {
  const { username, password, recaptchaToken } = loginData
  const response = await api.post('/login/', {
    username, password, recaptchaToken
  })
  return response.data
}

export const logout = async () => {
  const response = await api.post('/logout/')
  return response.data
}

export const protectedView = async () => {
  const response = await api.get('/protected/')
  return response.data
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

export const userNetwork = async () => {
  const response = await api.get(`/user_network/`)
  return response.data
}


export const updateUserDetails = async (userData: Partial<User>, icDocument?: File) => {
  const {
    addressLine,
    state,
    city,
    postcode,
    country,
    walletAddress,
    bineficiaryName,
    bineficiaryIc,
    bineficiaryRelationship,
    bineficiaryEmail,
    bineficiaryPhone, 
    verificationStatus,
   } = userData

   if (icDocument) {
    const formData = new FormData()

    const fields = {
      address_line: addressLine,
      address_state: state,
      address_city: city,
      address_postcode: postcode,
      address_country: country,
      wallet_address: walletAddress,
      bineficiary_name: bineficiaryName,
      bineficiary_ic: bineficiaryIc,
      bineficiary_relationship: bineficiaryRelationship,
      bineficiary_email: bineficiaryEmail,
      bineficiary_phone: bineficiaryPhone,
      verification_status: verificationStatus,
    }

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value)
      }
    })
    formData.append('ic_document', icDocument, icDocument.name)

    return api.put(`/update_user/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    })

   } else {
    const response = await api.put(`/update_user/`, {
      address_line: addressLine,
      address_state: state,
      address_city: city,
      address_postcode: postcode,
      address_country: country,
      wallet_address: walletAddress,
      bineficiary_name: bineficiaryName,
      bineficiary_ic: bineficiaryIc,
      bineficiary_relationship: bineficiaryRelationship,
      bineficiary_email: bineficiaryEmail,
      bineficiary_phone: bineficiaryPhone,
      verification_status: verificationStatus,
    })
    return response.data
  }
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

export const getConvertDepositStatement = async () => {
  const response = await api.get('/user_convert_deposit_tx/')
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
