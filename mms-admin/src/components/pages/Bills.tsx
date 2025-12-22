
import { NotiError } from "../props/Noti"
import { customerPortal } from "../auth/endpoints"

export const BillsDetails = async () => {
    try {

      const response = await customerPortal()
      window.location.href = response.portal

    } catch (error: any) {
      console.error(error.response)
      NotiError(error.response?.data?.error || 'An error occurred')
    } 
  }

