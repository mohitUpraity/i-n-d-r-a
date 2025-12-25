import React from 'react'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div>
      INDRA
      <Link to={"/auth"}>
      <button>
        auth
      </button>
      </Link>
    </div>
  )
}

export default LandingPage
