import { Link, useOutletContext } from 'react-router-dom'

// Protected by ProtectedLayout, which has already fetched the customer
// from GET /customers/me and passes it down through the Outlet context.
function Home() {
  const { user } = useOutletContext()

  return (
    <main className="home">
      <section className="welcome">
        <h1>Welcome, {user.fullName}!</h1>
        <p>You're logged in to ShopKart.</p>
        <Link to="/products" className="btn btn-primary btn-inline">
          Browse products
        </Link>
      </section>

      <section className="card profile">
        <h2>Your details</h2>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user.phone}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}

export default Home
