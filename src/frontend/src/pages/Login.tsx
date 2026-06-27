import { useState } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, VStack, Card, CardBody,
  CardHeader, Alert, AlertIcon, Checkbox,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password, rememberMe);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Произошла ошибка');
    } finally {
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
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <ChakraInput
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                size="lg"
                required
              />
              <ChakraInput
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="lg"
                required
              />
              <Checkbox
                isChecked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                alignSelf="flex-start"
              >
                Запомнить меня
              </Checkbox>
              <Button
                type="submit"
                colorScheme="blue"
                w="100%"
                size="lg"
                isLoading={loading}
              >
                Войти
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
}

export default Login;
