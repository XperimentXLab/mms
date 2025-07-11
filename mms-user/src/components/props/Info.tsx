

export const InfoWithdraw = () => {
  return (
    <ul className="list-disc px-6">
      <li className="text-gray-600 text-xs ">
        Minimum withdrawal is 50 USDT.
      </li>
      <li className="text-gray-600 text-xs">
        Withdrawal fee is 2%. Fees are subject to change.
      </li>
    </ul>
  )
}

export const InfoDeposit = () => {
  return (
    <li className="text-gray-600 text-xs px-2">
      Minimum deposit 200 USDT.
    </li>
  )
}

export const InfoConvert = () => {
  return (
    <li className="text-gray-600 text-xs px-2">
      Conversion must be in 10s (10, 20, 30, etc.).
    </li>
  )
}


export const InfoPlaceAsset = () => {
  return (
    <ul className="list-disc px-6">
      <li className="text-gray-600 text-xs ">
        Minimum 50 USDT.
      </li>
    </ul>
  )
}


export const InfoPassword = () => {
  return (
    <ul className="list-disc px-6">
      <li className="text-gray-600 text-xs ">
        Password must be at least 8 characters
      </li>
      <li className="text-gray-600 text-xs ">
        Password must contain at least 1 uppercase letter
      </li>
      <li className="text-gray-600 text-xs ">
        Password must contain at least 1 lowercase letter
      </li>
      <li className="text-gray-600 text-xs ">
        Password must contain at least 1 number
      </li>
    </ul>
  )
}

export const InfoDoc = () => {
  return (
    <ul className="list-disc px-6">
      <li className="text-gray-600 text-xs ">
        I/C or Driving License
      </li>
      <img src="../example-doc.jpeg"
        className="h-50"
      />
    </ul>
  )
}

export const InfoPersonal = () => {
  return (
    <ul className="list-disc px-6">
      <li className="text-gray-600 text-xs ">
        Please fill in information same as identification document.
      </li>
    </ul>
  )
}

