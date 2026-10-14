// Same rules as the backend. Checking here first gives instant feedback and
// avoids calling the API with a form we already know is wrong.
const LABELS = {
  fullName: 'Full name',
  phone: 'Phone number',
  addressLine1: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
}

export const validateShipping = (form) => {
  const address = {}
  const errors = {}

  for (const field of Object.keys(LABELS)) {
    address[field] = form[field].trim() // "   " becomes "" and counts as empty
    if (!address[field]) errors[field] = `${LABELS[field]} is required`
  }

  if (address.phone && !/^[6-9]\d{9}$/.test(address.phone)) {
    errors.phone = 'Enter a valid 10-digit mobile number'
  }
  if (address.pincode && !/^[1-9]\d{5}$/.test(address.pincode)) {
    errors.pincode = 'Pincode must contain 6 digits'
  }

  return { address, errors }
}
