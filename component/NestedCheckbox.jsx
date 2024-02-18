import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import styles from '../styles';

const NestedCheckbox = ({ data, onSelect }) => {
  const [checkedItems, setCheckedItems] = useState(new Map());

  const handleCheck = (heading, point) => {
    const updatedCheckedItems = new Map(checkedItems);

    if (point) {
      // Checkbox for a point is clicked
      if (updatedCheckedItems.has(heading)) {
        // Heading already exists in checked items
        const points = updatedCheckedItems.get(heading);
        if (points.includes(point)) {
          // If point is already checked, remove it
          updatedCheckedItems.set(heading, points.filter(p => p !== point));
        } else {
          // Add point if not already checked
          updatedCheckedItems.set(heading, [...points, point]);
        }
      } else {
        // Heading does not exist in checked items, add it with the point
        updatedCheckedItems.set(heading, [point]);
      }
    } else {
      // Checkbox for a heading is clicked
      if (updatedCheckedItems.has(heading)) {
        // If heading is already checked, remove it
        updatedCheckedItems.delete(heading);
      } else {
        // Add heading if not already checked
        updatedCheckedItems.set(heading, []);
      }
    }

    setCheckedItems(updatedCheckedItems);
    onSelect(updatedCheckedItems);
  };

  return (
    <View>
      {data.map((item, index) => (
        <View key={index}>
          <View style={styles.headingContainer}>
            <Checkbox.Item
              label={item.heading}
              status={checkedItems.has(item.heading) ? 'checked' : 'unchecked'}
              onPress={() => handleCheck(item.heading)}
              labelStyle={styles.headingLabel}
              position="leading"
            />
          </View>
          {checkedItems.has(item.heading) && (
            <View style={styles.pointsContainer}>
              {item.points.map((point, pointIndex) => (
                <View key={pointIndex} style={styles.pointContainer}>
                  <Checkbox.Item
                    label={point}
                    status={checkedItems.get(item.heading).includes(point) ? 'checked' : 'unchecked'}
                    onPress={() => handleCheck(item.heading, point)}
                    labelStyle={styles.pointLabel}
                    position="leading"
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};



export default NestedCheckbox;
