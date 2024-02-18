import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const Account = () => {
  const [name, setName] = useState('John Doe');
  const [gender, setGender] = useState('Not provided');
  const [location, setLocation] = useState('Your location');
  const [birthday, setBirthday] = useState('Your birthday');
  const [summary, setSummary] = useState('Tell us about yourself (interests, experience, etc.)');
  const [website, setWebsite] = useState('Your blog, portfolio, etc.');
  const [github, setGithub] = useState('Your Github username or url');
  const [linkedin, setLinkedin] = useState('Your LinkedIn username or url');
  const [twitter, setTwitter] = useState('Your Twitter username or url');
  const [history, setHistory] = useState([]); // Initial history data array

  const [showAllHistory, setShowAllHistory] = useState(false);

  const handleUpdate = () => {
    // Logic to update user information goes here
    // You can send the updated data to your backend server
    // and handle the update process accordingly
    alert('Information updated successfully!');
  };

  const visibleHistory = showAllHistory ? history : history.slice(0, 20);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={(text) => setName(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Gender</Text>
        <TextInput
          style={styles.input}
          placeholder="Not provided"
          value={gender}
          onChangeText={(text) => setGender(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Your location"
          value={location}
          onChangeText={(text) => setLocation(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Birthday</Text>
        <TextInput
          style={styles.input}
          placeholder="Your birthday"
          value={birthday}
          onChangeText={(text) => setBirthday(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Tell us about yourself (interests, experience, etc.)"
          multiline
          value={summary}
          onChangeText={(text) => setSummary(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          placeholder="Your blog, portfolio, etc."
          value={website}
          onChangeText={(text) => setWebsite(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Github</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Github username or url"
          value={github}
          onChangeText={(text) => setGithub(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>LinkedIn</Text>
        <TextInput
          style={styles.input}
          placeholder="Your LinkedIn username or url"
          value={linkedin}
          onChangeText={(text) => setLinkedin(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Twitter</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Twitter username or url"
          value={twitter}
          onChangeText={(text) => setTwitter(text)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Available Credit</Text>
        <Text>100 Credits</Text> {/* Placeholder for available credit */}
      </View>
    
      <TouchableOpacity onPress={handleUpdate} style={styles.updateButton}>
        <Text style={{ color: 'blue' }}>Update</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowAllHistory(!showAllHistory)} style={styles.historyButton}>
        <Text style={styles.historyButtonText}>History</Text>
      </TouchableOpacity>

      {visibleHistory.map((item, index) => (
        <View key={index} style={styles.historyItem}>
          <Text>Date: {item.date}</Text>
          <Text>Product: {item.product}</Text>
          <Text>Credits Used: {item.creditsUsed}</Text>
        </View>
      ))}

      {!showAllHistory && (
        <TouchableOpacity onPress={() => setShowAllHistory(true)} style={styles.paginationButton}>
          <Text style={styles.paginationText}>View More</Text>
        </TouchableOpacity>
      )}


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor:'#d3d3d3'
  },
  card: {
    backgroundColor:'#d3d3d3',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    padding: 10,
    borderWidth: 2,
    borderRadius:5,
    borderColor: 'gray',
  },
  historyButton: {
    alignItems: 'center',
    padding: 10,
    marginTop: 20,
    backgroundColor: 'gray',
    borderRadius: 5,
  },
  historyButtonText: {
    color: 'white',
    
    fontSize: 16,
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  paginationButton: {
    alignItems: 'center',
    padding: 10,
  },
  paginationText: {
    color: 'blue',
  },
  updateButton: {
    backgroundColor: '#d3d3d3',
    width:'15%',
    alignSelf:'center',
    borderRadius: 5,
    borderWidth:1,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    borderColor:'gray'
  },
});

export default Account;
