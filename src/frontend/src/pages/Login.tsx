import { useEffect, useState } from 'react';
import {
  Box, Button, Text, VStack, Card, CardBody,
  CardHeader, Alert, AlertIcon, Spinner,
} from '@chakra-ui/react';
import { FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = '/crm/api';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      navigate('/');
    }
  }, [searchParams]);

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleVkLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/vk-login`);
      window.location.href = response.data.url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при попытке входа через VK');
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      bg="gray.50"
      p={{ base: 4, md: 6 }}
    >
      <Card w="100%" maxW="400px" boxShadow="lg">
        <CardHeader textAlign="center" pb={2}>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="blue.600">
            Система учёта
          </Text>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              <Box fontSize="sm" ml={2}>{error}</Box>
            </Alert>
          )}
          <VStack spacing={4}>
            <Button
              leftIcon={loading ? <Spinner size="sm" /> : <FiLogIn />}
              colorScheme="blue"
              w="100%"
              size="lg"
              isLoading={loading}
              loadingText="Перенаправление..."
              onClick={handleVkLogin}
              bg="#0077FF"
              _hover={{ bg: '#0066DD' }}
              _active={{ bg: '#0055CC' }}
            >
              Войти через VK ID
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}

export default Login;
