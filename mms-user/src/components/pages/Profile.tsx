import React, { useEffect, useState } from "react"
import Loading from "../props/Loading"
import Spannn, { FixedText } from "../props/Textt"
import { PromoCode, updatePassword, updateUserDetails, userDetails } from "../auth/endpoints"
import { Inputss } from "../props/Formss"
import Buttons from "../props/Buttons"
import { apiCountry, uploadToCloudinary, /*openCloudinaryWidget,*/ type CountryType } from "../auth/api"
import { InfoDoc } from "../props/Info"

const Profile = () => {

  const [promoCode, setPromoCode] = useState<string>('')
  const [errorMessagePC, setErrorMessagePC] = useState<string>('')

  const [refferralCode, setRefferralCode] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [ic, setIc] = useState<string>('')
  const [walletAddress, setWalletAddress] = useState<string | undefined  | null>(undefined)
  const [addressLine, setAddressLine] = useState<string>('')
  const [state, setState] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [postcode, setPostcode] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [countryList, setCountryList] = useState<CountryType[]>([])

  const [beneficiaryName, setBeneficiaryName] = useState<string>('')
  const [beneficiaryIc, setBeneficiaryIc] = useState<string>('')
  const [beneficiaryRelationship, setBeneficiaryRelationship] = useState<string>('')
  const beneficiaryRelationshipList = ['Father', 'Mother', 'Spouse', 'Child', 'Sibling']
  const [beneficiaryEmail, setBeneficiaryEmail] = useState<string>('')
  const [beneficiaryPhone, setBeneficiaryPhone] = useState<string>('')

  const [verificationStatus, setVerificationStatus] = useState<string>('REQUIRES_ACTION')
  const [verificationStatusDisplay, setVerificationStatusDisplay] = useState<string>('')
  const [icDocument, setIcDocument] = useState<File | undefined>(undefined)

  const [editWalletAddress, setEditWalletAddress] = useState<string>('')
  const [editAddressLine, setEditAddressLine] = useState<string>('')
  const [editState, setEditState] = useState<string>('')
  const [editCity, setEditCity] = useState<string>('')
  const [editPostcode, setEditPostcode] = useState<string>('')
  const [editCountry, setEditCountry] = useState<string>('')
  const [editFirstName, setEditFirstName] = useState<string>('')
  const [editLastName, setEditLastName] = useState<string>('')
  const [editBeneficiaryName, setEditBeneficiaryName] = useState<string>('')
  const [editBeneficiaryIc, setEditBeneficiaryIc] = useState<string>('')
  const [editBeneficiaryRelationship, setEditBeneficiaryRelationship] = useState<string>('')
  const [editBeneficiaryEmail, setEditBeneficiaryEmail] = useState<string>('')
  const [editBeneficiaryPhone, setEditBeneficiaryPhone] = useState<string>('')

  const [oldPassword, setOldPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const [errorMessageVeri, setErrorMessageVeri] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await userDetails()
      setRefferralCode(response.id)
      setUsername(response.username)
      setEmail(response.email)
      setFirstName(response.first_name)
      setLastName(response.last_name)
      setIc(response.ic)
      setWalletAddress(response.wallet_address)
      setAddressLine(response.address_line)
      setState(response.address_state)
      setCity(response.address_city)
      setPostcode(response.address_postcode)
      setCountry(response.address_country)
      setBeneficiaryName(response.beneficiary_name)
      setBeneficiaryIc(response.beneficiary_ic)
      setBeneficiaryRelationship(response.beneficiary_relationship)
      setBeneficiaryEmail(response.beneficiary_email)
      setBeneficiaryPhone(response.beneficiary_phone)
      setVerificationStatus(response.verification_status)
      setVerificationStatusDisplay(response.verification_status_display)
      setErrorMessageVeri(response.reject_reason)

      // Initialize edit states with fetched data
      setEditWalletAddress(response.wallet_address || '')
      setEditAddressLine(response.address_line || '')
      setEditState(response.address_state || '')
      setEditCity(response.address_city || '')
      setEditPostcode(response.address_postcode || '')
      setEditCountry(response.address_country || '')
      setEditFirstName(response.first_name || '')
      setEditLastName(response.last_name || '')
      setEditBeneficiaryName(response.beneficiary_name || '')
      setEditBeneficiaryIc(response.beneficiary_ic || '')
      setEditBeneficiaryRelationship(response.beneficiary_relationship || '')
      setEditBeneficiaryEmail(response.beneficiary_email || '')
      setEditBeneficiaryPhone(response.beneficiary_phone || '')

      setFullName(`${response.first_name} ${response.last_name}`)

      const countryRes = await apiCountry
      setCountryList(countryRes)

      console.log(country)
    } catch (error: any) {
      setLoading(true)
      console.error('Error fetching user data:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
        alert(error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const toggleWalletAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await updateUserDetails({
        walletAddress: editWalletAddress,
      })
      alert('Wallet address updated successfully')
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await updateUserDetails({
        addressLine: editAddressLine,
        state: editState,
        city: editCity,
        postcode: editPostcode,
        country: editCountry,
      })
      alert('Address updated successfully')
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBeneficiary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await updateUserDetails({
        beneficiaryName: editBeneficiaryName,
        beneficiaryRelationship: editBeneficiaryRelationship,
        beneficiaryIc: editBeneficiaryIc,
        beneficiaryEmail: editBeneficiaryEmail,
        beneficiaryPhone: editBeneficiaryPhone,
      })
      alert('Beneficiary information updated successfully')
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }


  const toggleVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (!icDocument) {
        alert('Please select a document to upload.')
        return
      }
      await uploadToCloudinary(icDocument, refferralCode)
      alert('Document uploaded successfully.')
    } catch (error: any) {
      console.error(error.message)
      alert('Failed to upload document.')
    } finally {
      setLoading(false)
    }

  }

  const [errorMessageChangeP, setErrorMessageChangeP] = useState<string>('')
  const resetFormChangeP = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }
  const toggleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await updatePassword({
        oldPassword,
        newPassword,
        newConfirmPassword: confirmPassword,
      })
      alert('Password changed successfully')
      resetFormChangeP()
    } catch (error: any) {
      console.error(error)     
      if (error.response) {
        if (error.response.status === 400) {
          setErrorMessageChangeP(error.response.data.error)
        } else {
          setErrorMessageChangeP('A server error occurred. Please try again later or contact an administrator.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePromoCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await PromoCode(promoCode)
      alert('Promo code successfully entered.')
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setErrorMessagePC(error.response.data.error)
      } else {
        setErrorMessagePC('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="flex flex-col items-center p-3 w-full">
      <h1 className="font-bold text-lg">Edit Profile</h1>

      <div className="flex flex-col gap-4 p-2 items-center">

        <div className="grid grid-rows-3 gap-3 py-3 px-5 shadow-2xl w-full shadow-red-300 bg-white rounded-2xl border items-center">
          <h1 className="font-bold text-lg underline">Personal Information</h1>

          <Spannn label="USERNAME">{username}</Spannn>
          <Spannn label="EMAIL">{email}</Spannn>
          <Spannn label="NAME">{fullName}</Spannn>
          <Spannn label="I/C">{ic}</Spannn>
          <Spannn label="REFERRAL CODE">{refferralCode}</Spannn>

          <form onSubmit={toggleWalletAddress} className="grid grid-cols-1 gap-1.5">
            <Inputss type="text" label='WALLET ADDRESS (BEP20)' 
              placeholder={walletAddress ? walletAddress : "Enter your wallet address"}
              onChange={e => setEditWalletAddress(e.target.value)}
              value={editWalletAddress}
            />
            <Buttons type="submit">Save</Buttons>
          </form>

          {!firstName && !lastName &&<form className="grid grid-cols-1 gap-1.5">
            <Inputss type="text" label='First Name'
              placeholder={"Enter your last name"}
              onChange={e => setEditFirstName(e.target.value)}
              value={editFirstName}
              required={true}
            />
            <Inputss type="text" label='Last Name'
              placeholder={"Enter your last name"}
              onChange={e => setEditLastName(e.target.value)}
              value={editLastName}
              required={true}
            />
          </form>}

          <form className="grid grid-cols-1 gap-1.5" onSubmit={toggleAddress}>
            <Inputss type="text" label='ADDRESS LINE'
              placeholder={addressLine ? addressLine : "Enter your address line"}
              onChange={e => setEditAddressLine(e.target.value)}
              value={editAddressLine}
            />
            <Inputss type="text" label='CITY'
              placeholder={city ? city : "Enter your city"}
              onChange={e => setEditCity(e.target.value)}
              value={editCity}  
            />
            <Inputss type="text" label='STATE'
              placeholder={state ? state : "Enter your state"}
              onChange={e => setEditState(e.target.value)}
              value={editState}
            />
            <Inputss type="text" label='POSTCODE'
              placeholder={postcode ? postcode : "Enter your postcode"}
              onChange={e => setEditPostcode(e.target.value)}
              value={editPostcode}  
            />

            <div className="grid grid-row-2 gap-2">
              <label className="font-semibold">COUNTRY</label>
              <select className="border py-1 px-2 rounded-md"
                onChange={e => setEditCountry(e.target.value)}
                value={editCountry}
              >
                <option value={''}>Select your country</option>
                {countryList.map((countryName) => (
                  <option value={countryName.code} key={countryName.code} >
                    {countryName.name}
                  </option>
                ))}
              </select>

            </div>

            <Buttons type="submit">Save</Buttons>
          </form>

        </div>

        <form className="grid grid-rows-3 gap-3 py-3 px-5 w-full shadow-red-300 bg-white shadow-2xl rounded-2xl border items-center" onSubmit={toggleBeneficiary}>
          <h1 className="font-bold text-lg underline">Beneficiary Information</h1>

          <Inputss type="text" label='BENEFCIARY NAME'
            placeholder={beneficiaryName ? beneficiaryName : "Enter beneficiary name"}
            onChange={e => setEditBeneficiaryName(e.target.value)}
            value={editBeneficiaryName}
          />
          <Inputss type="text" label='BENEFCIARY I/C'
            placeholder={beneficiaryIc ? beneficiaryIc : "Enter beneficiary I/C"}
            onChange={e => setEditBeneficiaryIc(e.target.value)}
            value={editBeneficiaryIc}  
          />

          <div className="grid grid-row-2 gap-2">
            <label className="font-semibold">BENEFCIARY RELATIONSHIP</label>
            <select className="border py-1 px-2 rounded-md"
              onChange={e => setEditBeneficiaryRelationship(e.target.value)}
              value={editBeneficiaryRelationship}
            >
              <option value={beneficiaryRelationship ? beneficiaryRelationship : ''}>Select your relationship</option>
              {beneficiaryRelationshipList.map((relName) => (
                <option value={relName} key={relName} >
                  {relName}
                </option>
              ))}
            </select>
          </div>

          <Inputss type="email" label='BENEFCIARY EMAIL'
            placeholder={beneficiaryEmail ? beneficiaryEmail : "Enter beneficiary email"}
            onChange={e => setEditBeneficiaryEmail(e.target.value)}
            value={editBeneficiaryEmail}  
          />
          <Inputss type="text" label='BENEFCIARY PHONE'
            placeholder={beneficiaryPhone ? beneficiaryPhone : "Enter beneficiary phone"}
            onChange={e => setEditBeneficiaryPhone(e.target.value)}
            value={editBeneficiaryPhone}  
          />

          <Buttons type="submit">Save</Buttons>
        </form>

        <form onSubmit={handlePromoCode} className="flex flex-col gap-2 w-full items-center p-3 border rounded-xl shadow-red-300 bg-white shadow-2xl">
          <h1 className="font-bold text-lg underline">Promo Code</h1>

          <Inputss 
            type="text"
            placeholder="Enter promo code"
            onChange={e => setPromoCode(e.target.value)}
            value={promoCode}
            required={true}
          />
          {errorMessagePC && <span className="text-red-500 text-md">{errorMessagePC}</span>}
          <Buttons type="submit">Apply</Buttons>
        </form>

        <div className="flex flex-col gap-2 w-full items-center p-3 border rounded-xl shadow-red-300 bg-white shadow-2xl">
          <h1 className="font-bold text-lg underline">Verification</h1>

          <FixedText label='Status' text={verificationStatusDisplay} />
          {verificationStatus === 'UNDER_REVIEW' && <span className="text-md">Please wait for 24 hours for verification or contact administrator.</span>}

          {verificationStatus === 'REQUIRES_ACTION' && 
          <form className="grid grid-cols-1 gap-2" onSubmit={toggleVerification}>
            <label className="font-semibold">Upload Document</label>
            <input type="file" 
              className="border p-2 rounded-md cursor-pointer"
              accept=".jpg, .jpeg, .png, .pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setIcDocument(file)
                }
              }}
            />
            <InfoDoc />
            <Buttons type="submit" >Upload</Buttons>
            
          </form>}
          {verificationStatus === 'REJECTED' &&
            <form className="grid grid-cols-1 gap-2 justify-center" onSubmit={toggleVerification}>
            {errorMessageVeri && <span className="text-red-500 text-md">{errorMessageVeri}</span>}
            <label className="font-semibold">Upload Document</label>
            <input type="file" 
              className="border p-2 rounded-md cursor-pointer"
              accept=".jpg, .jpeg, .png, .pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setIcDocument(file)
                }
              }}
            />
            <InfoDoc />
            <Buttons type="submit" >Upload</Buttons>
            
          </form>}
        </div>

        <div className="flex flex-col gap-2 w-full items-center p-3 border rounded-xl shadow-red-300 bg-white shadow-2xl">
          <h1 className="font-bold text-lg underline">Change Password</h1>

          <form className="grid grid-cols-1 gap-2" onSubmit={toggleChangePassword}>
            <Inputss type="password" label='Old Password' 
              placeholder="Enter old password" 
              onChange={e => setOldPassword(e.target.value)}
              value={oldPassword}
            />
            <Inputss type="password" label='New Password' 
              placeholder="Enter new password" 
              onChange={e => setNewPassword(e.target.value)}
              value={newPassword}
            />
            <Inputss type="password" label='Confirm New Password' 
              placeholder="Confirm new password" 
              onChange={e => setConfirmPassword(e.target.value)}
              value={confirmPassword}
            />
            {errorMessageChangeP && <span className="text-red-500 text-md">{errorMessageChangeP}</span>}
            <Buttons type="submit">Change Password</Buttons>
          </form>
        </div>

      </div>

      { loading && <Loading /> }

    </div>
  )
}

export default Profile
