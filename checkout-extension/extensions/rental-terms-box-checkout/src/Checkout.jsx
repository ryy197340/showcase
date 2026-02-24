import { useEffect, useState, useCallback, useRef } from 'react'
import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  Text,
  Link,
  useApi,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  useSettings,
  useShop,
  Heading,
  useCartLines,
  useBuyerJourneyIntercept,
  useAppMetafields,
  useAttributes,
  useApplyCartLinesChange,
  Modal,
  TextBlock,
  Button,
  View,
  Divider
} from '@shopify/ui-extensions-react/checkout'

// 1. Choose an extension target
export default reactExtension(
  'purchase.checkout.actions.render-before',
  () => <Extension />
)

function Extension() {
  console.log('[Extension] ========== COMPONENT RENDER ==========')
  
  const { ui } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const translate = useTranslate()
  const instructions = useInstructions()
  const applyAttributeChange = useApplyAttributeChange()
  const settings = useSettings()
  const shop = useShop()
  const cartLines = useCartLines()
  const attributes = useAttributes()
  const [showExtension, setShowExtension] = useState(false)
  const [isSuspendedCustomer, setIsSuspendedCustomer] = useState(false);
  const [isTosAccepted, setIsTosAccepted] = useState(false)
  const [isCardAccepted, setIsCardAccepted] = useState(false)
  const appMetafields = useAppMetafields()
  const [isPatronIdAdded, setIsPatronIdAdded] = useState(false)
  const [showTosAgreementAlert, setShowTosAgreementAlert] = useState(false)
  const [showCardAgreementAlert, setShowCardAgreementAlert] = useState(false)
  const collateralAddAttemptedRef = useRef(false)
  const [validPatronId, setValidPatronId] = useState(false)
  const validationCompletedRef = useRef(false)
  const lastValidatedPatronIdRef = useRef(null) // Rastrear último patronId validado

  const patronId =
    appMetafields.find(entry => entry?.metafield?.key === "patron_id")
      ?.metafield?.value ?? null;

  const rentalCollateralCaptured =
    appMetafields.find(entry => entry?.metafield?.key === "rental_collateral_captured")
      ?.metafield?.value ?? null;

  const rentalTosContent =
    appMetafields.find(entry => entry?.metafield?.key === "rental_tos_content")
      ?.metafield?.value ?? ''

  console.log('[Extension] patronId:', patronId)
  console.log('[Extension] appMetafields count:', appMetafields.length)
  console.log('[Extension] cartLines count:', cartLines.length)
  console.log('[Extension] attributes:', JSON.stringify(attributes))

  // Check if checkout was accessed via QR code using cart attributes
  const checkoutOrigin = attributes.find(attr => attr.key === 'CheckoutOrigin')?.value
  const isQrCodeEntry = checkoutOrigin === 'qr_code'
  
  console.log('[Extension] checkoutOrigin:', checkoutOrigin)
  console.log('[Extension] isQrCodeEntry:', isQrCodeEntry)
  
  // Check if user has active rental collateral
  const hasActiveCollateral = patronId !== null && patronId !== '' && patronId !== 'null'
  
  console.log('[Extension] ========== COLLATERAL CHECK ==========')
  console.log('[Extension] hasActiveCollateral:', hasActiveCollateral)
  if (hasActiveCollateral) {
    console.log('[Extension] ✅ User HAS patron_id in metafields - will validate via API')
  } else {
    console.log('[Extension] ❌ User does NOT have patron_id - new rental customer')
  }
  console.log('[Extension] ==========================================')

  const QUERY = `
      query getVariantById($id: ID!) {
        node(id: $id) {
          ... on ProductVariant {
            id
            title
            sku
            product {
              id
              title
              tags
            }
          }
        }
      }
    `

  const VARIANT_METAFIELDS_QUERY = `
    query getVariantMetafields($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          id
          isRental: metafield(namespace: "cm_rental", key: "is_rental") {
            value
          }
          rentalExpDate: metafield(namespace: "cm_rental", key: "expiration_date") {
            value
          }
        }
      }
    }
  `

  const CART_LINE_ATTRIBUTES_QUERY = `
    query getCartLineAttributes($id: ID!) {
      cart {
        lines(first: 250) {
          edges {
            node {
              id
              attributes {
                key
                value
              }
            }
          }
        }
      }
    }
  `

  const FIND_COLLATERAL_PRODUCT_QUERY = `
    query findCollateralProduct($query: String!) {
      products(first: 1, query: $query) {
        edges {
          node {
            id
            handle
            requiresSellingPlan
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  sellingPlanAllocations(first: 1) {
                    edges {
                      node {
                        sellingPlan {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  // Block checkout if TOS is not accepted (only for regular checkout, not QR code)
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    console.log('[useBuyerJourneyIntercept] Called')
    console.log('[useBuyerJourneyIntercept] canBlockProgress:', canBlockProgress)
    console.log('[useBuyerJourneyIntercept] showExtension:', showExtension)
    console.log('[useBuyerJourneyIntercept] isTosAccepted:', isTosAccepted)
    console.log('[useBuyerJourneyIntercept] isCardAccepted:', isCardAccepted)
    console.log('[useBuyerJourneyIntercept] isQrCodeEntry:', isQrCodeEntry)
    console.log('[useBuyerJourneyIntercept] isSuspendedCustomer:', isSuspendedCustomer)
    
    // Block if customer is suspended
    if (canBlockProgress && isSuspendedCustomer) {
      console.log('[useBuyerJourneyIntercept] ❌ Blocking: Customer is suspended')
      return {
        behavior: 'block',
        reason: 'We\'re sorry, there is an issue with your rental account. Please contact the campus store for assistance with your account',
        errors: [
          {
            message: 'We\'re sorry, there is an issue with your rental account. Please contact the campus store for assistance with your account',
          },
        ],
      }
    }
    
    let hasError = false;
    if (canBlockProgress && showExtension && !isTosAccepted && !isQrCodeEntry) {
      console.log('[useBuyerJourneyIntercept] ❌ Blocking: TOS not accepted')
      setShowTosAgreementAlert(true)
      hasError = true
    }

    if (canBlockProgress && showExtension && !isCardAccepted && !isQrCodeEntry) {
      console.log('[useBuyerJourneyIntercept] ❌ Blocking: Card agreement not accepted')
      setShowCardAgreementAlert(true)
      hasError = true
    }

    if (hasError) {
      console.log('[useBuyerJourneyIntercept] Returning BLOCK behavior')
      return {
        behavior: 'block',
        reason: 'Terms and conditions not accepted',
      }
    }

    console.log('[useBuyerJourneyIntercept] ✅ Returning ALLOW behavior')
    return {
      behavior: 'allow',
    }
  })

  // 2. Check instructions for feature availability
  if (!instructions.attributes.canUpdateAttributes) {
    console.log('[Extension] ❌ Cannot update attributes, showing warning banner')
    return (
      <Banner
        title='rental-terms-box-checkout'
        status='warning'
      >
        {translate('attributeChangesAreNotSupported')}
      </Banner>
    )
  }

  const onCardAgreementChange = useCallback(async (isChecked) => {
    console.log('[onCardAgreementChange] Called with isChecked:', isChecked)
    setIsCardAccepted(isChecked)
    setShowCardAgreementAlert(!isChecked)
  }, [])

  const onTosAgreementChange = useCallback(async (isChecked) => {
    console.log('[onTosAgreementChange] ========== CALLED ==========')
    console.log('[onTosAgreementChange] isChecked:', isChecked)
    console.log('[onTosAgreementChange] patronId:', patronId)
    console.log('[onTosAgreementChange] isPatronIdAdded:', isPatronIdAdded)
    
    // Update local state (this will trigger useBuyerJourneyIntercept)
    setIsTosAccepted(isChecked)
    setShowTosAgreementAlert(!isChecked)

    // 4. Call the API to modify checkout attribute
    console.log('[onTosAgreementChange] Applying attribute change for RentalToSAccepted')
    const result = await applyAttributeChange({
      key: 'RentalToSAccepted',
      type: 'updateAttribute',
      value: isChecked ? 'true' : 'false',
    })
    console.log('[onTosAgreementChange] TOS agreement change result:', result)

    // Also update patron ID when TOS is accepted
    if (isChecked && patronId && !isPatronIdAdded) {
      console.log('[onTosAgreementChange] Adding RentalPatronId attribute:', patronId)
      const result = await applyAttributeChange({
        key: 'RentalPatronId',
        type: 'updateAttribute',
        value: patronId.toString(),
      })
      setIsPatronIdAdded(true)
      console.log('[onTosAgreementChange] RentalPatronId set result:', result)
    }
  }, [applyAttributeChange, patronId, isPatronIdAdded])


  useEffect(() => {
    console.log('[useEffect] ========== TRIGGERED ==========')
    console.log('[useEffect] cartLines length:', cartLines.length)
    console.log('[useEffect] appMetafields length:', appMetafields.length)
    console.log('[useEffect] hasActiveCollateral:', hasActiveCollateral)
    console.log('[useEffect] patronId:', patronId)
    console.log('[useEffect] rentalCollateralCaptured:', rentalCollateralCaptured)
    console.log('[useEffect] lastValidatedPatronIdRef.current:', lastValidatedPatronIdRef.current)
    console.log('[useEffect] collateralAddAttemptedRef.current:', collateralAddAttemptedRef.current)
    console.log('[useEffect] validationCompletedRef.current:', validationCompletedRef.current)
    
    // Reset validation ONLY when patronId actually changes (not just re-render)
    if (patronId !== lastValidatedPatronIdRef.current) {
      console.log('[useEffect] 🔄 patronId CHANGED from', lastValidatedPatronIdRef.current, 'to', patronId)
      console.log('[useEffect] Resetting validation flags')
      validationCompletedRef.current = false
      lastValidatedPatronIdRef.current = patronId
    } else {
      console.log('[useEffect] patronId unchanged, keeping validation state')
    }

    const checkItems = async (id) => {
      console.log('[checkItems] Checking item:', id)
      const res = await fetch('shopify:storefront/api/graphql.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query: QUERY, variables: { id: id } }),
      })
      const { data, errors } = await res.json()
      if (errors) {
        console.error('[checkItems] GraphQL errors:', errors)
      }
      console.log('[checkItems] Result for', id, ':', data?.node?.product?.title)
      return data
    }

    const getVariantMetafields = async (id) => {
      console.log('[getVariantMetafields] Getting metafields for:', id)
      const res = await fetch('shopify:storefront/api/graphql.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query: VARIANT_METAFIELDS_QUERY, variables: { id: id } }),
      })
      const { data, errors } = await res.json()
      if (errors) {
        console.error('[getVariantMetafields] GraphQL errors:', errors)
      }
      console.log('[getVariantMetafields] isRental:', data?.node?.isRental?.value)
      return data
    }

    /**
     * Restores rental properties if they are missing after customer login
     */
    const restoreRentalProperties = async () => {
      console.log('[restoreRentalProperties] Starting restoration check')
      
      for (const lineItem of cartLines) {
        try {
          const rentalExpDate = lineItem.attributes?.find(
            attr => attr.key === '_rental_expiration_date'
          )?.value
          const rentDueDate = lineItem.attributes?.find(
            attr => attr.key === 'Rent Due Date'
          )?.value

          console.log('[restoreRentalProperties] Line item:', lineItem.id)
          console.log('[restoreRentalProperties] rentalExpDate:', rentalExpDate)
          console.log('[restoreRentalProperties] rentDueDate:', rentDueDate)

          if ((!rentalExpDate || rentalExpDate.trim() === '') && 
              (!rentDueDate || rentDueDate.trim() === '')) {
            console.log('[restoreRentalProperties] Properties missing, checking metafields')
            
            const variantData = await getVariantMetafields(lineItem.merchandise.id)
            const isRental = variantData?.node?.isRental?.value === 'true'
            const metafieldExpDate = variantData?.node?.rentalExpDate?.value

            console.log('[restoreRentalProperties] isRental:', isRental)
            console.log('[restoreRentalProperties] metafieldExpDate:', metafieldExpDate)

            if (isRental && metafieldExpDate && metafieldExpDate.trim() !== '') {
              console.log('[restoreRentalProperties] ✅ Restoring properties')
              
              await applyCartLinesChange({
                type: 'updateCartLine',
                id: lineItem.id,
                quantity: lineItem.quantity,
                merchandiseId: lineItem.merchandise.id,
                attributes: [
                  { key: '_rental_expiration_date', value: metafieldExpDate },
                  { key: 'Rent Due Date', value: metafieldExpDate },
                ],
              })
              console.log('[restoreRentalProperties] Properties restored for:', lineItem.id)
            }
          } else {
            console.log('[restoreRentalProperties] Properties already exist, skipping')
          }
        } catch (error) {
          console.error('[restoreRentalProperties] ❌ Error:', error)
        }
      }
      
      console.log('[restoreRentalProperties] Restoration check complete')
    }

    const removeRentalFeeProduct = async () => {
      console.log('[removeRentalFeeProduct] ========== STARTING ==========')
      
      try {
        for (const lineItem of cartLines) {
          if (!lineItem || !lineItem.id || !lineItem.merchandise || !lineItem.merchandise.id) {
            console.warn('[removeRentalFeeProduct] Invalid line item, skipping:', lineItem)
            continue
          }

          console.log('[removeRentalFeeProduct] Checking line item:', lineItem.id)
          const data = await checkItems(lineItem.merchandise.id)
          
          if (!data || !data.node || !data.node.product) {
            console.warn('[removeRentalFeeProduct] Invalid product data for:', lineItem.id)
            continue
          }

          console.log('[removeRentalFeeProduct] Product tags:', data.node.product?.tags)

          if (data.node.product?.tags?.includes('Rental Collateral')) {
            console.log('[removeRentalFeeProduct] ✅ Found collateral product:', lineItem.id)
            
            try {
              const result = await applyCartLinesChange({
                type: 'removeCartLine',
                id: lineItem.id,
                quantity: 1,
              })
              
              console.log('[removeRentalFeeProduct] ✅ Successfully removed collateral:', result)
              return
            } catch (removeError) {
              console.error('[removeRentalFeeProduct] ❌ Error removing line item:', removeError)
              continue
            }
          }
        }
        
        console.log('[removeRentalFeeProduct] No collateral product found to remove')
      } catch (error) {
        console.error('[removeRentalFeeProduct] ❌ Unexpected error:', error)
      }
      
      console.log('[removeRentalFeeProduct] ========== COMPLETE ==========')
    }

    /**
     * Check if there are any rental items in the cart
     */
    const hasRentalItems = async () => {
      console.log('[hasRentalItems] Checking for rental items')
      
      for (const lineItem of cartLines) {
        const variantData = await getVariantMetafields(lineItem.merchandise.id)
        const isRental = variantData?.node?.isRental?.value === 'true'
        
        if (isRental) {
          console.log('[hasRentalItems] ✅ Found rental item:', lineItem.id)
          return true
        }
      }
      
      console.log('[hasRentalItems] ❌ No rental items found')
      return false
    }

    /**
     * Check if collateral product is already in cart
     */
    const hasCollateralProduct = async () => {
      console.log('[hasCollateralProduct] Checking for collateral product')
      
      for (const lineItem of cartLines) {
        const data = await checkItems(lineItem.merchandise.id)
        
        if (data.node.product?.tags?.includes('Rental Collateral')) {
          console.log('[hasCollateralProduct] ✅ Found collateral product:', lineItem.id)
          return true
        }
      }
      
      console.log('[hasCollateralProduct] ❌ No collateral product found')
      return false
    }

    /**
     * Find and add collateral product to cart
     */
    const addCollateralProduct = async () => {
      console.log('[addCollateralProduct] ========== STARTING ==========')
      
      try {
        console.log('[addCollateralProduct] Searching for collateral product')
        
        const res = await fetch('shopify:storefront/api/graphql.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            query: FIND_COLLATERAL_PRODUCT_QUERY,
            variables: { query: 'tag:"Rental Collateral"' },
          }),
        })
        const { data, errors } = await res.json()
        
        if (errors?.length) {
          console.error('[addCollateralProduct] ❌ GraphQL errors:', errors)
          return false
        }

        const product = data?.products?.edges?.[0]?.node
        console.log('[addCollateralProduct] Product found:', product?.id)
        
        if (!product) {
          console.warn('[addCollateralProduct] ❌ Collateral product not found')
          return false
        }

        const variant = product.variants?.edges?.[0]?.node
        console.log('[addCollateralProduct] Variant:', variant?.id)
        console.log('[addCollateralProduct] Available for sale:', variant?.availableForSale)
        console.log('[addCollateralProduct] Requires selling plan:', product.requiresSellingPlan)
        
        if (!variant || !variant.availableForSale) {
          console.warn('[addCollateralProduct] ❌ No available collateral variant')
          return false
        }

        // Extract selling plan ID if available
        const sellingPlanAllocation = variant.sellingPlanAllocations?.edges?.[0]?.node
        const sellingPlanId = sellingPlanAllocation?.sellingPlan?.id
        const sellingPlanName = sellingPlanAllocation?.sellingPlan?.name
        
        console.log('[addCollateralProduct] Selling Plan ID:', sellingPlanId)
        console.log('[addCollateralProduct] Selling Plan Name:', sellingPlanName)
        console.log('[addCollateralProduct] Adding collateral to cart:', variant.id)
        
        // Build cart line input
        const cartLineInput = {
          type: 'addCartLine',
          merchandiseId: variant.id,
          quantity: 1,
          attributes: [
            { key: '_Auto Added', value: 'true' },
            { key: '_Reason', value: 'Rental Collateral' },
          ],
        }
        
        // Try adding with selling plan first, fallback to without if it fails
        let result = null
        
        if (sellingPlanId) {
          console.log('[addCollateralProduct] 🔄 Attempting to add WITH selling plan...')
          try {
            result = await applyCartLinesChange({
              ...cartLineInput,
              sellingPlanId: sellingPlanId,
            })
            console.log('[addCollateralProduct] ✅ Successfully added WITH selling plan')
          } catch (error) {
            console.warn('[addCollateralProduct] ⚠️ Failed to add with selling plan:', error)
            console.log('[addCollateralProduct] 🔄 Falling back to add WITHOUT selling plan...')
            // Fallback: try without selling plan
            result = await applyCartLinesChange(cartLineInput)
            console.log('[addCollateralProduct] ✅ Successfully added WITHOUT selling plan (fallback)')
          }
        } else {
          console.log('[addCollateralProduct] ℹ️ No selling plan found, adding without it')
          result = await applyCartLinesChange(cartLineInput)
        }

        console.log('[addCollateralProduct] ✅ Collateral added result:', result)
        return true
      } catch (error) {
        console.error('[addCollateralProduct] ❌ Error:', error)
        return false
      }
    }

    /**
     * Validates patron ID by checking with Follett API
     * Returns true ONLY if both accountStatus and patronStatus are "Active"
     */
    const validatePatronId = async (patronId) => {
      console.log('[validatePatronId] ========== STARTING VALIDATION ==========')
      console.log('[validatePatronId] patronId:', patronId)
      console.log('[validatePatronId] patronId type:', typeof patronId)
      
      if (!patronId || patronId === 'null' || patronId === '') {
        console.log('[validatePatronId] ❌ Invalid patronId value (empty/null)')
        return false
      }

      try {
        console.log('[validatePatronId] 🌐 Making API request to Follett API...')
        console.log('[validatePatronId] URL: https://ecom.shopdev-integrations.follett.com/api/v1/rentals/patron/inquire')
        console.log('[validatePatronId] Payload:', { patron_id: patronId })
        
        const response = await fetch('https://ecom.shopdev-integrations.follett.com/api/v1/rentals/patron/inquire', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patron_id: patronId
          })
        })

        console.log('[validatePatronId] Response status:', response.status)
        console.log('[validatePatronId] Response ok:', response.ok)     

        const data = await response.json()
        console.log('[validatePatronId] ========== API RESPONSE ==========')
        console.log('[validatePatronId] Full response:', JSON.stringify(data, null, 2))

        // Check for error responses
        if (data.message) {
          console.log('[validatePatronId] ❌ Error message from API:', data.message)
          if (data.message === "Patron not found") {
            console.log('[validatePatronId] Patron does not exist in system')
          } else if (data.message === "Failed to inquire patron") {
            console.log('[validatePatronId] Invalid patron ID format or API error')
          }
          return false
        }

        // Check for successful response with active status
        console.log('[validatePatronId] patronId from response:', data.patronId)
        console.log('[validatePatronId] accountStatus (channel):', data.accountStatus)
        console.log('[validatePatronId] patronStatus:', data.patronStatus)
        if(data.patronStatus === "Suspended"){
          setIsSuspendedCustomer(true);
        }

        // Both accountStatus (channel) and patronStatus must be "Active"
        if (data.patronId && 
            data.accountStatus === 'Active' && 
            data.patronStatus === 'Active') {
          console.log('[validatePatronId] ✅ SUCCESS: Patron is ACTIVE')
          console.log('[validatePatronId] ✅ Channel Status: Active')
          console.log('[validatePatronId] ✅ Patron Status: Active')
          return true
        }

        // If we got a response but status is not active
        console.log('[validatePatronId] ❌ Patron exists but is NOT active')
        if (data.accountStatus !== 'Active') {
          console.log('[validatePatronId] ❌ Channel Status:', data.accountStatus, '(not Active)')
        }
        if (data.patronStatus !== 'Active') {
          console.log('[validatePatronId] ❌ Patron Status:', data.patronStatus, '(not Active)')
        }
        return false

      } catch (error) {
        console.error('[validatePatronId] ❌ ERROR during API call:', error)
        console.error('[validatePatronId] Error name:', error.name)
        console.error('[validatePatronId] Error message:', error.message)
        if (error.stack) {
          console.error('[validatePatronId] Error stack:', error.stack)
        }
        return false
      }
    }

    const checkAllItems = async () => {
      console.log('[checkAllItems] ========== STARTING ==========')
      
      // Se a validação já foi completada para este patronId, não executar novamente
      if (validationCompletedRef.current) {
        console.log('[checkAllItems] ⏭️ Validation already completed, skipping')
        return
      }
      
      // Check if there are rental items in the cart
      const hasRental = await hasRentalItems()
      console.log('[checkAllItems] hasRental:', hasRental)
      
      if (!hasRental) {
        console.log('[checkAllItems] ❌ No rental items, hiding extension')
        collateralAddAttemptedRef.current = false
        setShowExtension(false)
        validationCompletedRef.current = true
        return
      }

      // CRITICAL: If user has patron_id in metafields, we MUST validate it via API
      if (hasActiveCollateral) {
        console.log('[checkAllItems] 🔍 User has patron_id in metafields:', patronId)
        console.log('[checkAllItems] Making API call to validate patron status...')
        
        const isValid = await validatePatronId(patronId)
        console.log("TEST ISVALID RESULT: ", isValid);
        console.log('[checkAllItems] 📋 API Validation result:', isValid)
        setValidPatronId(isValid)
        validationCompletedRef.current = true
        console.log("TEST chega aqui? ", isValid, rentalCollateralCaptured);

        if (!isValid && rentalCollateralCaptured == 'false') {
        console.log('INACTIVE and metafield FALSE test')
        console.log('[checkAllItems] ❌ No rental items, hiding extension')
        collateralAddAttemptedRef.current = true
        setShowExtension(true)
        validationCompletedRef.current = true
        return
      }

        if (isValid && rentalCollateralCaptured == 'false') {
          console.log('ACTIVE and metafield FALSE test')
        console.log('[checkAllItems] ❌ No rental items, hiding extension')
        collateralAddAttemptedRef.current = true
        setShowExtension(true)
        validationCompletedRef.current = true
        return
      }
        
        if (isValid && rentalCollateralCaptured == 'true') {
          console.log('ACTIVE and metafield TRUE test')
          console.log('[checkAllItems] ✅ Patron is ACTIVE - User has valid collateral on file')
          console.log('[checkAllItems] Hiding extension (no checkboxes needed)')
          setShowExtension(false)
          
          // Remove collateral product if it exists (user doesn't need to pay it)
          try {
            const hasCollateral = await hasCollateralProduct()
            console.log('[checkAllItems] Checking for collateral in cart:', hasCollateral)
            
            if (hasCollateral) {
              console.log('[checkAllItems] Removing collateral product from cart')
              await removeRentalFeeProduct()
            }
          } catch (error) {
            console.error('[checkAllItems] ❌ Error during collateral removal:', error)
          }
          
          return
        } else {
          console.log('[checkAllItems] ❌ Patron is INACTIVE or NOT FOUND')
          console.log('[checkAllItems] User needs to accept terms and pay collateral')
          // Continue to show extension and add collateral below
        }
      } else {
        console.log('[checkAllItems] ℹ️ User does NOT have patron_id in metafields')
        console.log('[checkAllItems] User is a new rental customer')
      }

      // User does NOT have valid collateral - show terms and add collateral product
      console.log('[checkAllItems] 📝 Showing rental terms extension')
      
      const hasCollateral = await hasCollateralProduct()
      console.log('[checkAllItems] Collateral product in cart:', hasCollateral)
      
      if (!hasCollateral) {
        console.log('[checkAllItems] collateralAddAttemptedRef.current:', collateralAddAttemptedRef.current)
        
        if (!collateralAddAttemptedRef.current) {
          console.log('[checkAllItems] 🛒 Attempting to add collateral product to cart')
          collateralAddAttemptedRef.current = true
          
          const added = await addCollateralProduct()
          console.log('[checkAllItems] Collateral add result:', added)
          
          if (added) {
            console.log('[checkAllItems] ⏳ Waiting 500ms before showing extension')
            setTimeout(() => {
              console.log('[checkAllItems] ✅ Setting showExtension = true (after delay)')
              setShowExtension(true)
            }, 500)
          } else {
            console.log('[checkAllItems] ⚠️ Failed to add collateral, showing extension anyway')
            setShowExtension(true)
          }
        } else {
          console.log('[checkAllItems] ✅ Collateral add already attempted, showing extension')
          setShowExtension(true)
        }
      } else {
        console.log('[checkAllItems] ✅ Collateral already in cart, showing extension')
        collateralAddAttemptedRef.current = false
        setShowExtension(true)
      }
      
      validationCompletedRef.current = true
      console.log('[checkAllItems] ========== COMPLETE ==========')
    }

    // Função principal que executa toda a lógica
    const runEffectLogic = async () => {
      if (appMetafields.length > 0 && cartLines.length > 0) {
        console.log('[useEffect] ========================================')
        console.log('[useEffect] appMetafields and cartLines available, proceeding')
        
        const isRentalCaptured =
          appMetafields.find(entry => entry?.metafield?.key === "rental_collateral_captured")
            ?.metafield?.value ?? null;
        
        console.log('[useEffect] ========================================')
        console.log('[useEffect] rental_collateral_captured metafield:', isRentalCaptured)
        console.log('[useEffect] hasActiveCollateral (patron_id exists):', hasActiveCollateral)
        console.log('[useEffect] ========================================')
        
        // CRITICAL CHANGE: If patron_id exists, ALWAYS validate via API
        // We cannot trust rental_collateral_captured - API is the source of truth
        if (hasActiveCollateral) {
          console.log('[useEffect] 🔍 PATRON_ID EXISTS - API validation is REQUIRED')
          console.log('[useEffect] patron_id:', patronId)
          console.log('[useEffect] Ignoring rental_collateral_captured - API is source of truth')
          console.log('[useEffect] Running checkAllItems() to validate patron status...')
          console.log('[useEffect] ========================================')
          
          await checkAllItems()
          await restoreRentalProperties()
          return
        }
        
        // No patron_id - check rental_collateral_captured for cleanup
        if (isRentalCaptured && isRentalCaptured === 'true') {
          console.log('[useEffect] 🎯 No patron_id, but rental was captured')
          console.log('[useEffect] This is likely a completed order - cleaning up')
          console.log('[useEffect] ========================================')
          
          collateralAddAttemptedRef.current = false
          await removeRentalFeeProduct()
          setShowExtension(false)
          validationCompletedRef.current = true
          return
        }
        
        // No patron_id and rental not captured - regular flow
        console.log('[useEffect] 🎯 No patron_id - running regular validation flow')
        console.log('[useEffect] ========================================')
        
        await checkAllItems()
        await restoreRentalProperties()
      } else {
        console.log('[useEffect] ⏳ Waiting for appMetafields or cartLines')
      }
    }

    // Executar a lógica
    runEffectLogic()
  }, [cartLines, appMetafields, applyCartLinesChange, hasActiveCollateral, patronId])

  // 3. Render UI
  console.log('[Extension] Render decision:')
  console.log('[Extension] showExtension:', showExtension)
  console.log('[Extension] isQrCodeEntry:', isQrCodeEntry)
  
  if (!showExtension || isQrCodeEntry) {
    console.log('[Extension] ❌ NOT rendering extension')
    return null
  }

  console.log('[Extension] ✅ RENDERING extension UI')
  
  return (
    <BlockStack spacing='tight'>
      <Heading level={2}>{translate('RentalTOS')}</Heading>
      <Checkbox
        checked={isTosAccepted}
        onChange={onTosAgreementChange}
      >
        <Text>
          I agree to the{' '}
          <Link overlay={
            <Modal
              id="my-modal"
              padding
              title="Rental Agreement"
            >
              <BlockStack>
                <View>
                  {rentalTosContent.split('\n').map((line, i) => (
                    <TextBlock key={i}>{line}</TextBlock>
                  ))}
                </View>
                <Divider />
                <View blockAlignment='end'>
                  <Button
                    onPress={() =>
                      ui.overlay.close('my-modal')
                    }
                  >
                    Close
                  </Button>
                </View>
              </BlockStack>
            </Modal>
          }>
            Rental Agreement Terms & Conditions
          </Link>{' '}
          for {shop.name}.
        </Text>
      </Checkbox>

      {showTosAgreementAlert && showExtension && (
        <Banner status="critical">
          You must accept the rental agreement to continue.
        </Banner>
      )}

      <Checkbox
        checked={isCardAccepted}
        onChange={onCardAgreementChange}
      >
        <Text>
          A debit or credit card is required to rent textbooks and will be kept on file for potential damages, overdue, or unreturned rental charges. I understand the debit/ credit card provided will be charged in the event of a non-return of rental
        </Text>
      </Checkbox>

      {showCardAgreementAlert && showExtension && (
        <Banner status="critical">
          You must agree to this statement or you can remove the rental item from your shopping cart to proceed.
        </Banner>
      )}
    </BlockStack>
  )
}