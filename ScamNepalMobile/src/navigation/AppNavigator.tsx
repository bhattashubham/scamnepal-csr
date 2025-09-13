import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import MyReportsScreen from '../screens/main/MyReportsScreen';
import CreateReportScreen from '../screens/main/CreateReportScreen';
import FileUploadScreen from '../screens/main/FileUploadScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import HelpScreen from '../screens/main/HelpScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ReportDetailsScreen from '../screens/main/ReportDetailsScreen';
import EntityDetailsScreen from '../screens/main/EntityDetailsScreen';
import AddUserScreen from '../screens/admin/AddUserScreen';
import ModerationQueueScreen from '../screens/admin/ModerationQueueScreen';

import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#fff' },
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

const MainTabNavigator = ({ user }: { user: User }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;

        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Search':
            iconName = 'search';
            break;
          case 'Reports':
            iconName = 'description';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          case 'Admin':
            iconName = 'admin-panel-settings';
            break;
          default:
            iconName = 'help';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Reports" component={ReportsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
    {(user.role === 'admin' || user.role === 'moderator') && (
      <Tab.Screen name="Admin" component={AdminScreen} />
    )}
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
        {user ? (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabNavigator user={user} />}
            </Stack.Screen>
            <Stack.Screen 
              name="ReportDetails" 
              component={ReportDetailsScreen}
              options={{ headerShown: true, title: 'Report Details' }}
            />
            <Stack.Screen 
              name="EntityDetails" 
              component={EntityDetailsScreen}
              options={{ headerShown: true, title: 'Entity Details' }}
            />
            <Stack.Screen 
              name="CreateReport" 
              component={CreateReportScreen}
              options={{ headerShown: true, title: 'Report a Scam' }}
            />
            <Stack.Screen 
              name="MyReports" 
              component={MyReportsScreen}
              options={{ headerShown: true, title: 'My Reports' }}
            />
            <Stack.Screen 
              name="FileUpload" 
              component={FileUploadScreen}
              options={{ headerShown: true, title: 'Upload Evidence' }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ headerShown: true, title: 'Edit Profile' }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ headerShown: true, title: 'Notifications' }}
            />
            <Stack.Screen 
              name="Help" 
              component={HelpScreen}
              options={{ headerShown: true, title: 'Help & Support' }}
            />
            {(user.role === 'admin' || user.role === 'moderator') && (
              <>
                <Stack.Screen 
                  name="AddUser" 
                  component={AddUserScreen}
                  options={{ headerShown: true, title: 'Add User' }}
                />
                <Stack.Screen 
                  name="UserManagement" 
                  component={UserManagementScreen}
                  options={{ headerShown: true, title: 'User Management' }}
                />
                <Stack.Screen 
                  name="ModerationQueue" 
                  component={ModerationQueueScreen}
                  options={{ headerShown: true, title: 'Moderation Queue' }}
                />
              </>
            )}
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
