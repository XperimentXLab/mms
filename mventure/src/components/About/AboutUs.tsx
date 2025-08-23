
export const AboutUsSimple = () => {
  return (
    <div className="font-['Stylish']">
      We are a team of financial experts dedicated to helping you grow your wealth. We specialize in professional crypto fund management, providing a service that’s both safe and easy to use. Our goal is to empower you to build a secure financial future without the daily stress of active trading.
    </div>
  )
}

const Vision = () => {
  return (
    <div>
      <h2 className="font-bold font-['Concert_One'] text-2xl">Vision</h2>
      <span>
        To make financial freedom a reality for everyone. We believe passive income is the key to unlocking a life of security and peace of mind, and we're dedicated to helping you achieve it through smart, professional crypto asset management.
      </span>
    </div>
  )
}

const Mission = () => {
  return (
    <div>
      <h2 className="font-bold font-['Concert_One'] text-2xl">Mission</h2>
      <span>
        To provide a seamless and secure platform where our expert fund managers grow user financial assets, helping them build lasting wealth and achieve financial freedom.
      </span>
    </div>
  )
}

const AboutUs = () => {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-semibold text-3xl font-['Prosto_One']">About Us</h1>

      <AboutUsSimple />

      <Vision />

      <Mission />

    </div>
  )
}

export default AboutUs
