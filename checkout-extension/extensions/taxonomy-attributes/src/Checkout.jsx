import React, {useEffect} from 'react';
import {
  reactExtension,
  useCartLines,
  useApplyCartLinesChange,
  BlockStack,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.checkout.block.render', () => {
  console.log('[Taxonomy Attributes] Extension mounted');
  return <Extension />;
});

const VARIANT_METAFIELDS_QUERY = `
  query getVariantMetafields($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        product {
          id
          tags
          department: metafield(namespace: "taxonomy", key: "department") {
            value
          }
          subDepartment: metafield(namespace: "taxonomy", key: "sub_department") {
            value
          }
          class: metafield(namespace: "taxonomy", key: "class") {
            value
          }
          subClass: metafield(namespace: "taxonomy", key: "sub_class") {
            value
          }
        }
        department: metafield(namespace: "taxonomy", key: "department") {
          value
        }
        subDepartment: metafield(namespace: "taxonomy", key: "sub_department") {
          value
        }
        class: metafield(namespace: "taxonomy", key: "class") {
          value
        }
        subClass: metafield(namespace: "taxonomy", key: "sub_class") {
          value
        }
      }
    }
  }
`;

function Extension() {
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const METAFIELD_NAMESPACE = 'taxonomy';
  const METAFIELD_KEY_DEPARTMENT = 'department';
  const METAFIELD_KEY_SUB_DEPARTMENT = 'sub_department';
  const METAFIELD_KEY_CLASS = 'class';
  const METAFIELD_KEY_SUB_CLASS = 'sub_class';

  const getVariantMetafields = async (variantId) => {
    console.log('[Taxonomy Attributes] Fetching metafields for variant:', variantId);
    try {
      const res = await fetch('shopify:storefront/api/graphql.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ 
          query: VARIANT_METAFIELDS_QUERY, 
          variables: { id: variantId } 
        }),
      });
      const { data, errors } = await res.json();
      if (errors?.length) {
        console.error('[Taxonomy Attributes] GraphQL errors for variant', variantId, ':', errors);
        return null;
      }
      console.log('[Taxonomy Attributes] GraphQL response for variant', variantId, ':', data?.node);
      return data?.node;
    } catch (error) {
      console.error('[Taxonomy Attributes] Error fetching variant metafields for', variantId, ':', error);
      return null;
    }
  };

  useEffect(() => {
    // Wait for cart lines to be loaded
    if (!cartLines || cartLines.length === 0) {
      console.log('[Taxonomy Attributes] No cart lines yet');
      return;
    }

    console.log('[Taxonomy Attributes] Processing', cartLines.length, 'cart lines');
    async function ensurePropertiesOnLines() {
      const changes = [];
      for (let i = 0; i < cartLines.length; i++) {
        const line = cartLines[i];
        
        
        console.log(`[Taxonomy Attributes] Processing line ${i + 1}/${cartLines.length}:`, {
          id: line.id,
          merchandise: line.merchandise,
          quantity: line.quantity,
          merchandiseId: line.merchandise?.id,
          merchandiseTitle: line.merchandise?.title,
          existingAttributes: line.attributes || [],
        });
        
        const merchandise = line.merchandise;
        if (!merchandise || !merchandise.id) {
          console.log('[Taxonomy Attributes] Line', line.id, 'has no merchandise ID, skipping');
          continue;
        }
        
        
        console.log('[Taxonomy Attributes] Line', line.id, '- Fetching product info to check for "adoptedtitle" tag');
        
        
        
        
        //const shouldProcess = hasAdoptedTitleTag || hasAdoptedSupplyTag || hasRentalCollateralTag || hasDigitalDeliveryFeeTag;
        const shouldProcess = true; // change to process all the products
        
             
        console.log('[Taxonomy Attributes] Line', line.id, '- Should process:', shouldProcess);
        
        if (!shouldProcess) {
          console.log('[Taxonomy Attributes] Line', line.id, '- Product does NOT have required tag, SKIPPING');
          continue;
        }
        
        
        
        // Now check existing attributes in cart line
        const existingDepartmentAttr = line.attributes?.find(
          (attr) => attr.key === '_department' && attr.value && attr.value !== '',
        );
        const existingSubDepartmentAttr = line.attributes?.find(
          (attr) => attr.key === '_sub_department' && attr.value && attr.value !== '',
        );
        const existingClassAttr = line.attributes?.find(
          (attr) => attr.key === '_class' && attr.value && attr.value !== '',
        );
        const existingSubClassAttr = line.attributes?.find(
          (attr) => attr.key === '_sub_class' && attr.value && attr.value !== '',
        );
        
        
        
        console.log('[Taxonomy Attributes] Cart line items attributes check (current state):', {
          department: existingDepartmentAttr ? `EXISTS (${existingDepartmentAttr.value})` : 'MISSING - will fetch from GraphQL',
          sub_department: existingSubDepartmentAttr ? `EXISTS (${existingSubDepartmentAttr.value})` : 'MISSING - will fetch from GraphQL',
          class: existingClassAttr ? `EXISTS (${existingClassAttr.value})` : 'MISSING - will fetch from GraphQL',
          sub_class: existingSubClassAttr ? `EXISTS (${existingSubClassAttr.value})` : 'MISSING - will fetch from GraphQL',
        });
        
        // Check if any of the required attributes are missing
        const hasAllAttributes = existingDepartmentAttr && existingSubDepartmentAttr && existingClassAttr && existingSubClassAttr;
        
        if (hasAllAttributes) {
          // All attributes already exist, skip this line          
          console.log('[Taxonomy Attributes] Line', line.id, 'already has all attributes in cart line items:', {
            department: existingDepartmentAttr.value,
            sub_department: existingSubDepartmentAttr.value,
            class: existingClassAttr.value,
            sub_class: existingSubClassAttr.value,
          });
          console.log('[Taxonomy Attributes] Line', line.id, '- Skipping (no update needed)');
          continue;
        }
        
        const variantData = await getVariantMetafields(merchandise.id);
        if (!variantData) {
          console.log('[Taxonomy Attributes] Line', line.id, 'could not fetch variant data, skipping');
          continue;
        }
        
        console.log('[Taxonomy Attributes] Line', line.id, 'has missing attributes, fetching metafields from GraphQL');
        
        const departmentValue = variantData.department?.value || variantData.product.department?.value;
        const subDepartmentValue = variantData.subDepartment?.value || variantData.product.subDepartment?.value;
        const classValue = variantData.class?.value || variantData.product.class?.value;
        const subClassValue = variantData.subClass?.value || variantData.product.subClass?.value;
        
        console.log('[Taxonomy Attributes] Line', line.id, 'metafields from GraphQL:', {
          department: departmentValue || 'MISSING',
          sub_department: subDepartmentValue || 'MISSING',
          class: classValue || 'MISSING',
          sub_class: subClassValue || 'MISSING',
        });

        // Check if all metafields are present
        if (departmentValue && subDepartmentValue && classValue && subClassValue) {
          console.log('[Taxonomy Attributes] Line', line.id, 'has all metafields, adding to attributes');
          
          // Check if attributes already exist to avoid duplicates
          const needsDepartment = !existingDepartmentAttr;
          const needsSubDepartment = !existingSubDepartmentAttr;
          const needsClass = !existingClassAttr;
          const needsSubClass = !existingSubClassAttr;
          
          if (needsDepartment || needsSubDepartment || needsClass || needsSubClass) {
            const newAttributes = [...(line.attributes || [])];
            const addedAttributes = [];
            
            if (needsDepartment) {
              
              // Check the length of departmentValue
              if (String(departmentValue).length === 1) {
                  // If length is 1, prepend "00" to departmentValue
                  newAttributes.push({ key: '_department', value: '00' + String(departmentValue) });
              } else if (String(departmentValue).length === 2) {
                  // If length is 2, prepend "0" to departmentValue
                  newAttributes.push({ key: '_department', value: '0' +  String(departmentValue) });
              } else {
                  // For other cases or different lengths, add the value as is
                  newAttributes.push({ key: '_department', value: String(departmentValue) });
              }
              addedAttributes.push('_department');
              
            }
            if (needsSubDepartment) {

              // Check the length of subDepartmentValue
              if (String(subDepartmentValue).length === 1) {
                  // If length is 1, prepend "00" to subDepartmentValue
                  newAttributes.push({ key: '_sub_department', value: '00' + String(subDepartmentValue) });
              } else if (String(subDepartmentValue).length === 2) {
                  // If length is 2, prepend "0" to subDepartmentValue
                  newAttributes.push({ key: '_sub_department', value: '0' +  String(subDepartmentValue) });
              } else {
                  // For other cases or different lengths, add the value as is
                  newAttributes.push({ key: '_sub_department', value: String(subDepartmentValue) });
              }
              
              addedAttributes.push('_sub_department');
              
            }
            if (needsClass) {

              // Check the length of classValue
              if (String(classValue).length === 1) {
                  // If length is 1, prepend "00" to classValue
                  newAttributes.push({ key: '_class', value: '00' + String(classValue) });
              } else if (String(classValue).length === 2) {
                  // If length is 2, prepend "0" to classValue
                  newAttributes.push({ key: '_class', value: '0' +  String(classValue) });
              } else {
                  // For other cases or different lengths, add the value as is
                  newAttributes.push({ key: '_class', value: String(classValue) });
              }
              
              addedAttributes.push('_class');
              
            }
            if (needsSubClass) {

              // Check the length of subClassValue
              if (String(subClassValue).length === 1) {
                  // If length is 1, prepend "00" to subClassValue
                  newAttributes.push({ key: '_sub_class', value: '00' + String(subClassValue) });
              } else if (String(subClassValue).length === 2) {
                  // If length is 2, prepend "0" to subClassValue
                  newAttributes.push({ key: '_sub_class', value: '0' +  String(subClassValue) });
              } else {
                  // For other cases or different lengths, add the value as is
                  newAttributes.push({ key: '_sub_class', value: String(subClassValue) });
              }
             
              addedAttributes.push('_sub_class');
              
            }
            
            console.log('[Taxonomy Attributes] Line', line.id, '- Successfully added attributes:', addedAttributes.join(', '));
            
            
            console.log('[Taxonomy Attributes] Line', line.id, 'will be updated with attributes:', {
              oldAttributes: line.attributes || [],
              newAttributes: newAttributes,
              adding: {
                department: needsDepartment,
                sub_department: needsSubDepartment,
                class: needsClass,
                sub_class: needsSubClass,
              },
            });

            changes.push({
              type: 'updateCartLine',
              id: line.id,
              quantity: line.quantity,
              merchandiseId: line.merchandise.id,
              attributes: newAttributes,
            });
            
            
            console.log('[Taxonomy Attributes] Line', line.id, '- Added to changes array (total changes:', changes.length, ')');
          } else {
            console.log('[Taxonomy Attributes] Line', line.id, 'all attributes already exist in cart line, no update needed');
          }
        } else {
          // Log which metafields are missing
          const missing = [];
          if (!departmentValue) missing.push('department');
          if (!subDepartmentValue) missing.push('sub_department');
          if (!classValue) missing.push('class');
          if (!subClassValue) missing.push('sub_class');
          console.log('[Taxonomy Attributes] Line', line.id, 'missing metafields in GraphQL response:', missing.join(', '), '- cannot add to cart line');
        }
      }
      
      console.log('[Taxonomy Attributes] ========================================');
      console.log('[Taxonomy Attributes] Total changes to apply:', changes.length);
      if (changes.length > 0) {
        console.log('[Taxonomy Attributes] Changes array:', JSON.stringify(changes, null, 2));
        
        // Apply each change individually
        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          console.log(`[Taxonomy Attributes] Applying change ${i + 1}/${changes.length}:`, {
            type: change.type,
            id: change.id,
            attributesCount: change.attributes?.length || 0,
          });
          
          try {
            await applyCartLinesChange(change);
            console.log(`[Taxonomy Attributes] ✅ Successfully applied change ${i + 1}/${changes.length} to line ${change.id}`);
          } catch (error) {
            console.error(`[Taxonomy Attributes] ❌ Error applying change ${i + 1}/${changes.length}:`, error);
          }
        }
        
        console.log('[Taxonomy Attributes] ✅ Successfully applied all', changes.length, 'changes to cart lines');
      } else {
        console.log('[Taxonomy Attributes] No changes to apply - all cart lines already have required attributes');
      }
      console.log('[Taxonomy Attributes] ========================================');
    }
    // Run when the cart changes (e.g., when opening the checkout or changing lines)
    // Only process if we have cart lines
    if (cartLines && cartLines.length > 0) {
      ensurePropertiesOnLines();
    }
  }, [cartLines, applyCartLinesChange]);

  // Return empty block - no visible UI, just runs in background
  return <BlockStack />;
}
