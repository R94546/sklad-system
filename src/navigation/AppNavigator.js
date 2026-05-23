import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import DebtsScreen from '../screens/DebtsScreen';
import SalesScreen from '../screens/SalesScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScannerScreen from '../screens/ScannerScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const tabScreenOptions = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: '#2563eb',
  tabBarInactiveTintColor: '#9ca3af',
  tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 65, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff', elevation: 10 },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  tabBarIcon: ({ focused, color }) => {
    let iconName;
    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
    else if (route.name === 'Sales') iconName = focused ? 'cart' : 'cart-outline';
    else if (route.name === 'Products') iconName = focused ? 'cube' : 'cube-outline';
    else if (route.name === 'Clients') iconName = focused ? 'people' : 'people-outline';
    else if (route.name === 'Debts') iconName = focused ? 'card' : 'card-outline';
    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
    return <Ionicons name={iconName} size={22} color={color} />;
  },
});

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Asosiy' }} />
      <Tab.Screen name="Sales" component={SalesScreen} options={{ tabBarLabel: 'Sotish' }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ tabBarLabel: 'Mahsulot' }} />
      <Tab.Screen name="Clients" component={ClientsScreen} options={{ tabBarLabel: 'Mijozlar' }} />
      <Tab.Screen name="Debts" component={DebtsScreen} options={{ tabBarLabel: 'Nasiya' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuthStore();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
