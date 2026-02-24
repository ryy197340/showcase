import React, { useEffect, useState } from "react";
import {
  Button,
  Icon,
  Image,
  RadioButtonList,
  ScrollView,
  SectionHeader,
  Selectable,
  Stack,
  Text,
} from "@shopify/ui-extensions-react/point-of-sale";
import colorData from './color-code.json'

export const VariantOptionList = ({
  api,
  variantsToShow,
  filter,
  filterVal,
}: {
  api: any;
  variantsToShow: any;
  filter: string;
  filterVal: string;
}) => {
  const [selected, setSelected] = React.useState(filterVal || "");
  const [options, setOptions] = useState([]);
  useEffect(() => {
   if(filter){ 
    let data =  [...new Set(variantsToShow.flatMap((variant: { selectedOptions: any[]; }) =>
      variant.selectedOptions.filter((option: { name: any; }) => option.name === filter)
        .map((option: { value: any; }) => option.value)
    ))];
    setOptions(data);
  }
  }, [variantsToShow, filter]);
  useEffect(() => {
    setSelected(filterVal);
  }, [filterVal]);
  const onSelectOption = (val: string) => {
    setSelected(val);
    api.navigation.navigate("product-variants", {
      filterName: filter,
      value: val,
    });
  };

  const findColorCode = (colorName: string) => {
    for (const item of colorData) {
      if (item.colorLabel.toLowerCase() === colorName.toLowerCase()) {
        return item.colorCode;
      }
      if (item.colorSubCode) {
        for (const subItem of item.colorSubCode) {
          if (subItem.colorLabel.toLowerCase() === colorName.toLowerCase()) {
            return subItem.colorCode;
          }
        }
      }
    }
    return null;
  };
  function generateURL (color : string){
    let colorCode =  findColorCode(String(color).trim())?.replace("#", "")
     return `https://dummyimage.com/3x3/${colorCode}/${colorCode}.png&text=.`
  }
  return (
    <>
      <Stack
        alignment="space-between"
        paddingHorizontal="Small"
        direction="horizontal"
      >
        <Selectable onPress={() => api.navigation.navigate("product-variants")}>
          <Icon name="cancel" size="minor" />
        </Selectable>
        <Button title="Clear" onPress={() => onSelectOption("")} type="plain" />
      </Stack>
      <Stack direction="vertical" paddingHorizontal="Small">
        {filter &&<SectionHeader title={`Filter by ${filter}`} />}
      </Stack>
      <ScrollView>
        { 
          filter !== 'color' && filter !== 'Color' &&
        (
        <RadioButtonList
          items={options}
          onItemSelected={(val) => onSelectOption(val)}
          initialSelectedItem={selected}
          initialOffsetToShowSelectedItem={true}
        />) 
}
        {filter === 'color' || filter === 'Color' && (
            <Stack direction="vertical" paddingHorizontal="Small" paddingVertical="Small">
                
                {options.map((color) => (
                    
                    <Selectable  onPress={() => onSelectOption(color)}>
                    <Stack direction="horizontal">
                         <Image
                            src={generateURL(color)}
                        />
                        <Text>{color}</Text>
                        <Button title={selected === color ? "✔" : ""} type="plain" />
                       
                    </Stack>
                    <Text color="TextDisabled">  </Text>
                    </Selectable>
                    
                ))}
                
            
            </Stack>
        )
}
      </ScrollView>
      
    </>
  );
};
