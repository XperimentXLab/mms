import axios from "axios";
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