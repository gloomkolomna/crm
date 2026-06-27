import { useState, useMemo } from 'react';
import {
  Table, Thead, Tbody, Tr, Th, Td, Box, IconButton, Text,
  Menu, MenuButton, MenuList, MenuItem, MenuDivider,
  Input as ChakraInput, HStack, Badge, Flex
} from '@chakra-ui/react';
import { FiFilter, FiArrowUp, FiArrowDown, FiX } from 'react-icons/fi';

export interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select';
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface SortableTableProps {
  columns: ColumnConfig[];
  data: any[];
  size?: 'sm' | 'md' | 'lg';
}

function SortableTable({ columns, data, size = 'md' }: SortableTableProps) {
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Получаем уникальные значения для select-фильтров
  const getUniqueValues = (key: string) => {
    const values = data.map(row => {
      const val = row[key];
      if (val === null || val === undefined) return '';
      return String(val);
    }).filter(v => v !== '');
    return [...new Set(values)].sort();
  };

  // Фильтрация и сортировка
  const processedData = useMemo(() => {
    let result = [...data];

    // Применяем фильтры
    for (const [key, filterValue] of Object.entries(filters)) {
      if (filterValue) {
        result = result.filter(row => {
          const cellValue = row[key];
          if (cellValue === null || cellValue === undefined) return false;
          return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    }

    // Применяем сортировку
    if (sort) {
      result.sort((a, b) => {
        const aVal = a[sort.key];
        const bVal = b[sort.key];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Числовая сортировка
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Строковая сортировка
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (sort.direction === 'asc') {
          return aStr.localeCompare(bStr, 'ru');
        }
        return bStr.localeCompare(aStr, 'ru');
      });
    }

    return result;
  }, [data, filters, sort]);

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null; // Сброс
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '') {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSort(null);
  };

  const activeFiltersCount = Object.keys(filters).length + (sort ? 1 : 0);

  const getSortIcon = (key: string) => {
    if (sort?.key !== key) return <Text fontSize="xs" color="gray.400">⇅</Text>;
    return sort.direction === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />;
  };

  return (
    <Box>
      {/* Панель активных фильтров */}
      {activeFiltersCount > 0 && (
        <Flex gap={2} mb={3} align="center" wrap="wrap">
          <Text fontSize="sm" color="gray.500">Активные фильтры:</Text>
          {Object.entries(filters).map(([key, value]) => {
            const col = columns.find(c => c.key === key);
            return (
              <Badge key={key} colorScheme="blue" display="flex" alignItems="center" gap={1} px={2} py={1}>
                {col?.label}: {value}
                <FiX
                  size={12}
                  cursor="pointer"
                  onClick={() => handleFilterChange(key, '')}
                />
              </Badge>
            );
          })}
          {sort && (
            <Badge colorScheme="green" display="flex" alignItems="center" gap={1} px={2} py={1}>
              Сортировка: {columns.find(c => c.key === sort.key)?.label} {sort.direction === 'asc' ? '↑' : '↓'}
              <FiX size={12} cursor="pointer" onClick={() => setSort(null)} />
            </Badge>
          )}
          <IconButton
            aria-label="Сбросить фильтры"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={clearAllFilters}
            title="Сбросить все фильтры"
          />
        </Flex>
      )}

      <Table variant="simple" size={size}>
        <Thead>
          <Tr>
            {columns.map(col => (
              <Th key={col.key} width={col.width}>
                <Flex direction="column" gap={1}>
                  {/* Заголовок с сортировкой */}
                  <HStack spacing={1} cursor={col.sortable !== false ? 'pointer' : 'default'}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    userSelect="none"
                  >
                    <Text fontSize="sm" fontWeight="semibold">
                      {col.label}
                    </Text>
                    {col.sortable !== false && (
                      <Box color={sort?.key === col.key ? 'blue.500' : 'gray.400'}>
                        {getSortIcon(col.key)}
                      </Box>
                    )}
                  </HStack>

                  {/* Фильтр колонки */}
                  {col.filterable !== false && (
                    <Menu closeOnSelect={col.filterType === 'text'}>
                      <MenuButton
                        as={IconButton}
                        icon={<FiFilter />}
                        size="xs"
                        variant={filters[col.key] ? 'solid' : 'ghost'}
                        colorScheme={filters[col.key] ? 'blue' : 'gray'}
                        aria-label={`Фильтр ${col.label}`}
                      />
                      <MenuList p={2} minW="200px">
                        {col.filterType === 'select' ? (
                          <>
                            <MenuItem
                              onClick={() => handleFilterChange(col.key, '')}
                              fontWeight={!filters[col.key] ? 'bold' : 'normal'}
                            >
                              Все
                            </MenuItem>
                            <MenuDivider />
                            {getUniqueValues(col.key).map(val => (
                              <MenuItem
                                key={val}
                                onClick={() => handleFilterChange(col.key, val)}
                                fontWeight={filters[col.key] === val ? 'bold' : 'normal'}
                              >
                                {val}
                              </MenuItem>
                            ))}
                          </>
                        ) : (
                          <Box>
                            <ChakraInput
                              placeholder={`Поиск по ${col.label.toLowerCase()}...`}
                              value={filters[col.key] || ''}
                              onChange={e => handleFilterChange(col.key, e.target.value)}
                              size="sm"
                            />
                          </Box>
                        )}
                      </MenuList>
                    </Menu>
                  )}
                </Flex>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {processedData.length > 0 ? (
            processedData.map((row, idx) => (
              <Tr key={row.id || idx}>
                {columns.map(col => (
                  <Td key={col.key}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] !== null && row[col.key] !== undefined
                        ? String(row[col.key])
                        : '-'
                    }
                  </Td>
                ))}
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan={columns.length} textAlign="center" py={8}>
                <Text color="gray.500">Нет данных</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
}

export default SortableTable;