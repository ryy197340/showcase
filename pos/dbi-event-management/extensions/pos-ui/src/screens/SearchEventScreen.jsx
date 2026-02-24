import React, { useState } from 'react'
import {
  Text,
  Screen,
  ScrollView,
  Button,
  Stack,
  TextField,
  useApi,
} from '@shopify/ui-extensions-react/point-of-sale'

export const SearchEventScreen = () => {
  const api = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    
    if (!formData.phone.trim() && !formData.email.trim()) {
      newErrors.phone = 'Either phone or email is required'
      newErrors.email = 'Either phone or email is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSearch = async () => {
    if (!validateForm()) {
      api.toast.show('Please complete all required fields', 3000)
      return
    }

    try {
      setIsLoading(true)
      
      // Log the search data
      console.log('Searching for:', formData)
      
      // Make a test API request to JSONPlaceholder
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      })
      
      const data = await response.json()
      console.log('Search results:', data)
      
      api.toast.show(`Found ${data.length || 0} matching events`, 3000)
    
    } catch (error) {
      console.error('Search error:', error)
      api.toast.show(`Unable to complete search. Please try again.`, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  return (
    <Screen 
      name="SearchEvent"
      title="Search Events"
      onBack={() => api.navigation.pop()}
    >
      <ScrollView>
        <Stack direction="vertical" gap="400" padding="400">
          <TextField
            label="First Name"
            value={formData.firstName}
            onChange={(value) => handleInputChange('firstName', value)}
            error={errors.firstName}
            required
          />
          <TextField
            label="Last Name"
            value={formData.lastName}
            onChange={(value) => handleInputChange('lastName', value)}
            error={errors.lastName}
            required
          />
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(value) => handleInputChange('phone', value)}
            error={errors.phone}
            type="tel"
            helpText="Enter phone number or email below"
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            error={errors.email}
            type="email"
            helpText="Enter email or phone number above"
          />
          <Button
            title={isLoading ? "Searching..." : "Search Events"}
            kind="primary"
            onPress={handleSearch}
            loading={isLoading}
            fullWidth
          />
        </Stack>
      </ScrollView>
    </Screen>
  )
} 