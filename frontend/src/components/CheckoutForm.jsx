const FIELDS = [
  { name: 'fullName', label: 'Full Name', placeholder: 'Aarav Sharma', autoComplete: 'name' },
  { name: 'phone', label: 'Phone', placeholder: '9876543210', type: 'tel', autoComplete: 'tel' },
  {
    name: 'addressLine1',
    label: 'Address',
    placeholder: 'House no., street, area',
    autoComplete: 'street-address',
  },
  { name: 'city', label: 'City', placeholder: 'Bengaluru', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', placeholder: 'Karnataka', autoComplete: 'address-level1' },
  {
    name: 'pincode',
    label: 'Pincode',
    placeholder: '560001',
    inputMode: 'numeric',
    autoComplete: 'postal-code',
  },
]

// Controlled shipping form. The Checkout page owns the values and errors;
// this component only renders them and reports changes.
function CheckoutForm({ id, values, errors, disabled, onChange, onSubmit }) {
  return (
    <form id={id} className="card checkout-form" onSubmit={onSubmit} noValidate>
      <h2>Shipping Details</h2>

      <div className="form-grid">
        {FIELDS.map((field) => (
          <div
            key={field.name}
            className={`form-field ${field.name === 'addressLine1' ? 'full-width' : ''}`}
          >
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              inputMode={field.inputMode}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={onChange}
              disabled={disabled}
              className={errors[field.name] ? 'invalid' : ''}
              aria-invalid={Boolean(errors[field.name])}
            />
            {errors[field.name] && <p className="field-error">{errors[field.name]}</p>}
          </div>
        ))}
      </div>
    </form>
  )
}

export default CheckoutForm
