import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    padding: 20,
  },
  Header: {
    flexDirection: 'row',
  },
  titleFlex: {
    flex:1,
  },
  LLMFlex: {
    flex:1,
    minHeight:161,  
    alignItems:'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  LLM: {
    fontSize: 24,
    fontWeight: 'bold',
    width:'50%',
    position:'absolute',
    backgroundColor:'#d3d3d3'
  },
  searchBar: {
    height: 40,
    width: 700,
    borderColor: 'gray',
    borderWidth: 2,
    borderRadius: 5,
  },
  businessLink: {
    fontSize: 16,
    color: 'blue',
  },
  rowContainer: {
    flex: 1,
  },
  rowItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',    
    flexDirection: 'row',
  },
  rowItem1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  searchBarFlex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  searchButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    
    height: 40,
    width: 200,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'blue',
    fontSize: 16,
  },
  LoginInputFlex: {
    height: 40,
    width: 350,
    margin:20,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  LoginInput: {
    height: 40,
    width: 350,
    
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  LoginButtonFlex: {
    height: 100,
    flexDirection:'row',
    margin:50,
    zIndex : 1

  },
  LoginButton: {
    height: 40,
    width: 200,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex : 1
  },
  TextFlex: {
    height: 40,
    width: 350,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'gray',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    height: 150,
    width: 200,
    alignContent:'center',
    alignItems:'center',
    alignSelf:'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  AddUrlFlex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'gray',
    flexDirection:'row'
  },
  AddUrlTextBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection:'column'
  }
  ,
  AddUrlButton: {
    flex: .4,
    height: 40,
    width: 100,
    flexDirection:'column',
    borderWidth: 2,
    borderTopRightRadius:5,
    borderBottomRightRadius:5,
    borderColor: 'gray',
    backgroundColor:'blue'
  },
  AddUrl: {
    height: 40,
    width: 1000,
    borderColor: 'gray',
    borderWidth: 2,
    borderTopLeftRadius:5,
    borderBottomLeftRadius:5,
  },
  AddUrlbuttonText: {
    color: 'white',
    fontSize: 16,
    alignContent:'center',
    alignItems:'center',
    paddingLeft:50,
    paddingTop:7
  },
  AddUrlList: {
    flex:1,
    borderColor: 'gray',
    borderWidth: 2,
    borderRadius:5,
    flexDirection:'row'
  },
  AddUrlRow: {
    flex:1,
    borderColor: 'gray',
    flexDirection:'row'
  },
  errorText: {
    flex:1,
    borderColor: 'red',
    color:'red',
    fontSize:10
  },
  errorViewFlex: {
    flex:.1,
    color: 'red',
    fontSize:10,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'gray',
    flexDirection:'row'
  },
  AddUrlText: {
    height: 40,
    width: 1000,
    borderColor: 'gray',
    color:'black',
    borderWidth: 2,
    borderTopLeftRadius:5,
    borderBottomLeftRadius:5,
  },
  SeoContentFlex: {
    flex:1,
    borderColor: 'gray',
    paddingTop:10,    
    flexDirection:'row'
  },
  TitleInputBox: {
    margin:20,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding:10
  },
  TitleBodyBox: {
    margin:20,
    height: 400,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding:10
  },
  ContentButtonFlex: {
    flex:1,
    marginLeft:400,
    alignContent:"center",
    borderColor: 'gray',
    flexDirection:'row',
    backgroundColor:'red'
  },
  ContentButton: {
    flex: .2,
    height: 40,
    width: 20,
    margin:20,
    borderWidth: 1,
    borderRadius:5,
    alignContent:"center",
    borderColor: 'gray',
    backgroundColor:'blue'
  },
  ContentButtonText: {
    margin:5,
    color: 'white',
    fontSize: 16,
    alignContent:'center',
    alignItems:'center',
    alignSelf: "center",
  },
  keyWordButton:{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'lightgray',
      margin:5,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1
  },
  keyWordButtonFlex:{
    flex:1,
    margin:10,
    alignContent:"center",
    borderColor: 'gray',
    flexDirection:'row'
  },  
  tagCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  crossText: {
    color: '#ffffff',
    fontSize: 18,
  },
  tagContainer: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
    backgroundColor:'blue'
  },
  tagText: {
    color: '#ffffff',
    fontSize: 16,
  },
  competitorContainer: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
    backgroundColor: 'blue'
  },
  GenerateStructureFlex: {
    flex: 1,
    borderWidth: 1,
    borderRadius:5,
    alignItems:'center',
    alignContent:"center",
    borderColor: 'gray',
    backgroundColor:'blue'
  },
  TopicContainer: {
    flex: 1,

    justifyContent:'center',
    alignContent:"center",
    padding:10,
    backgroundColor:'red'
  },
  StructureContainer: {
    flex: 1,

    alignContent:"center",
    padding:10,
  },
  BlogTopicInputBox: {
    height: 40,
    width:'60%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,

    padding:10, 
  },
  BlogTopicInputContainer: {
    flex: 1,
    borderColor: 'gray',
    alignItems:'center',
    margin:15,
  },
  GenerateStructureButtonFlex: {

    width:'14%',
    borderWidth: 2,
    borderRadius:5,
    margin:20,
    borderColor: 'gray',
    backgroundColor:'#d3d3d3'
  },
  GenerateButtonText: {
    color: 'blue',
    margin:10,
    fontSize: 15,
    alignItems:'center',
    alignSelf:'center'
  },
  EditArticleButtonFlex: {

    borderWidth: 2,
    borderRadius:5,
    margin:10,
    borderColor: 'gray',
    backgroundColor:'#d3d3d3'
  },
  EditBoxContainer: {
    flex: 1,
    marginTop:40,
    margin:10,
    alignContent:"center",
    padding:10
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  pointsContainer: {
    marginLeft: 20,
  },
  pointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headingLabel: {
    flex: 1,
    textAlign: 'left',
  },
  pointLabel: {
    flex: 1,
    textAlign: 'left',
  },
  checkbox: {
    alignSelf: 'flex-start',
  },
  GeneratedArticleText: {
    color: 'blue',
    margin:10,
    fontSize: 30,
    alignItems:'left',
    alignSelf:'left'
  },
  Title: {
    flex:1,
    borderColor: 'gray',
    borderWidth: 2,
    borderTopLeftRadius:5,
    borderBottomLeftRadius:5,
  },
  TitleInputBox: {
    margin:20,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding:10
  },
  disabledInput: {
    backgroundColor: 'gray',
    borderColor: '#dcdcdc', // Change border color for disabled input
    borderWidth: 1, // Change background color of disabled TextInput
  },
  AutoTitleLabel: {
    flex: 1,
    textAlign: 'left',
    color: 'blue',
    margin:10,
    fontSize: 15,
  },
  GenerateArticleButton: {

    borderWidth: 2,
    borderRadius:5,
    width:'15%',
    alignSelf:'center',
    margin:'43%',
    borderColor: 'gray',
    backgroundColor:'#d3d3d3'
  },
  GenerateArticleButtonFlex: {
    flex:1,    
    alignContent:"center",
    alignItems:'center',
  
    borderColor: 'gray',
    flexDirection:'row'
  },
  FinalArticleContainer: {
    flex: 1,
    marginTop:40,

    margin:10,
    alignContent:"center",
    flexBasis:1000,
    

  },
  FinalArticleFlex: {
    flex: 1,

    alignContent:"center",
    height:'100%',
    backgroundColor: '#f2f2f2', // Background color similar to original blog
 
    borderRadius:5
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',

  },
  article: {

  },
  TagsButton: {
    height: '50',
    borderWidth: 2,
    borderRadius:5,
    width:'50%',
    alignSelf:'center',
    borderColor: 'gray',
    backgroundColor:'#d3d3d3'
  },
  SaveButton: {
    height: '50',
    borderWidth: 2,
    borderRadius:5,
    width:'50%',
    alignSelf:'center',
    borderColor: 'gray',
    backgroundColor:'#d3d3d3'
  },
  PublishButton: {
    height: '50',
    borderWidth: 2,
    borderRadius:5,
    width:'50%',
    alignSelf:'center',
    borderColor: 'gray',
    backgroundColor:'#d3d3d3'
  },
  ButtonFlex: {
    margin:30,
    flexDirection:'row',
    
  },
  TagsButtonFlex: {
    flex:.4,
    flexDirection:'column',
    borderColor: 'gray',
    backgroundColor:'#d3d3d3',
    alignContent:'flex-end',
    alignItems:'flex-end'
  },
  SaveButtonFlex: {
    flex:.4,
    flexDirection:'column',
    borderColor: 'gray',
    backgroundColor:'#d3d3d3',

  },
  PublishButtonFlex: {
    flex:.4,
    flexDirection:'column',
    borderColor: 'gray',
    backgroundColor:'#d3d3d3',
    alignContent:'flex-start',
    alignItems:'flex-start'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '20%'
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    marginBottom: 10,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  menuButton: {
    marginRight: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  button: {
    marginLeft: 10,
  },
  drawerStyle: {
    backgroundColor: 'transparent',
  },
  headerStyle: {
    backgroundColor: '#333',
  },
});

export default styles;
