import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  Box, Flex, VStack, HStack, Text, Button, IconButton, Drawer,
  DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader,
  DrawerBody, useDisclosure, Spacer
} from '@chakra-ui/react';
import {
  FiHome, FiPackage, FiBox, FiUsers, FiTool, FiShoppingCart, FiBarChart2, FiLogOut, FiMenu, FiTag, FiHash, FiTruck, FiHelpCircle
} from 'react-icons/fi';

import { AuthProvider, useAuth } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Equipment from './pages/Equipment';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import Units from './pages/Units';
import ShippingMethods from './pages/ShippingMethods';
import Guide from './pages/Guide';
import Login from './pages/Login';

const menuItems = [
  { path: '/', label: 'Дашборд', icon: FiHome },
  { path: '/materials', label: 'Материалы', icon: FiPackage },
  { path: '/categories', label: 'Категории', icon: FiTag },
  { path: '/units', label: 'Ед. измерения', icon: FiHash },
  { path: '/products', label: 'Продукты', icon: FiBox },
  { path: '/equipment', label: 'Оборудование', icon: FiTool },
  { path: '/customers', label: 'Клиенты', icon: FiUsers },
  { path: '/sales', label: 'Продажи', icon: FiShoppingCart },
  { path: '/shipping-methods', label: 'Способы доставки', icon: FiTruck },
  { path: '/reports', label: 'Отчёты', icon: FiBarChart2 },
  { path: '/guide', label: 'Справка', icon: FiHelpCircle },
];

function Sidebar() {
  const location = useLocation();
  return (
    <VStack align="stretch" spacing={1} p={2}>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Button
            key={item.path}
            as={Link}
            to={item.path}
            leftIcon={<item.icon />}
            variant={isActive ? 'solid' : 'ghost'}
            colorScheme={isActive ? 'blue' : 'gray'}
            justifyContent="flex-start"
            w="100%"
            size={{ base: 'md', md: 'sm' }}
          >
            {item.label}
          </Button>
        );
      })}
    </VStack>
  );
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!isAuthenticated) {
    return (
      <Router basename="/crm">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router basename="/crm">
      <Flex h="100vh" direction="column">
        <Flex
          as="header"
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          px={{ base: 3, md: 4 }}
          py={3}
          align="center"
          boxShadow="sm"
        >
          <IconButton
            aria-label="Menu"
            icon={<FiMenu />}
            variant="ghost"
            onClick={onOpen}
            display={{ base: 'flex', md: 'none' }}
          />
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="blue.600">
            Система учёта
          </Text>
          <Spacer />
          <HStack spacing={{ base: 2, md: 4 }}>
            <Text fontSize="sm" color="gray.600" display={{ base: 'none', md: 'block' }}>
              {user?.username}
            </Text>
            <Button
              leftIcon={<FiLogOut />}
              size="sm"
              variant="outline"
              onClick={logout}
            >
              <Box as="span" display={{ base: 'none', md: 'inline' }}>Выйти</Box>
            </Button>
          </HStack>
        </Flex>

        <Flex flex={1} overflow="hidden">
          <Box
            as="nav"
            w={240}
            bg="gray.50"
            borderRight="1px"
            borderColor="gray.200"
            display={{ base: 'none', md: 'block' }}
            overflowY="auto"
          >
            <Sidebar />
          </Box>

          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Меню</DrawerHeader>
              <DrawerBody p={0}>
                <Sidebar />
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          <Box as="main" flex={1} overflowY="auto" p={{ base: 3, md: 6 }} bg="gray.50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/units" element={<Units />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/shipping-methods" element={<ShippingMethods />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Flex>
      </Flex>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;