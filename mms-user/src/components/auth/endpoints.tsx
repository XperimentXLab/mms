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
  user_id: string;
  oldPassword: string;
  newPassword: string;
  newConfirmPassword: string;
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


export const verifyWithDjango = async (token: string) => {
  try {
    const response = await api.post('/login_verify/', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.data.error) throw new Error('Verification failed')
    
    // Handle successful verification (e.g., redirect)
  } catch (error) {
    console.error('Verification error:', error)
  }
}


export const protectedView = async () => {
  const response = await api.get('/protected/')
  return response.data
}


export const updatePassword = async (passwordData: updatePassData) => {
  const { oldPassword, newPassword, newConfirmPassword, user_id } = passwordData
  const response = await api.post(`/update_password/${user_id}`, {
    old_password: oldPassword,
    new_password: newPassword,
    confirm_password: newConfirmPassword
  })
  return response.data
}

export const userDetails = async (user_id: string) => {
  const response = await api.get(`/user_details/${user_id}`)
  return response.data
}

export const userNetwork = async (user_id: string) => {
  const response = await api.get(`/user_network/${user_id}`)
  return response.data
}

export const updateUserDetails = async (userData: Partial<User>, icDocument?: File) => {
  const {
    user_id,
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

    return api.put(`/update_user/${user_id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    })

   } else {
    const response = await api.put(`/update_user/${user_id}`, {
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