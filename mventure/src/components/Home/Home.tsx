import { NavLink } from "react-router-dom"
import Body from "./Body"
import Side from "./Side"

const Home = () => {
  return (
    <div className="flex flex-col gap-2">
      <h1>Home</h1>
      <Body />
      <Side />

      <NavLink to="/faqs">FAQs</NavLink>
      
      <NavLink to="/contact">Still got question? Contact us.</NavLink>
    </div>
  )
}

export default Home
