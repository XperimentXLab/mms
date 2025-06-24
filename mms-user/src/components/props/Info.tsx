

export const InfoWithdraw = () => {
  return (
    <ul className="list-disc px-6">
      <li className="text-gray-600 text-xs ">
        Minimum withdrawal is 50 USDT.
      </li>
      <li className="text-gray-600 text-xs">
        Withdrawal fee is 3%.
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
