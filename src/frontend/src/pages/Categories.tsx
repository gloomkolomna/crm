import { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, Select as ChakraSelect,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, useDisclosure, FormLabel
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';
import SortableTable from '../components/SortableTable';
import type { ColumnConfig } from '../components/SortableTable';

interface Category { id: number; name: string; parent_id: number | null; }

interface CategoryRow extends Category {
  depth: number;
  parent_name: string;
}

function buildCategoryTree(
  categories: Category[], excludeId?: number | null
): { id: number; label: string }[] {
  const map = new Map<number, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];
  const result: { id: number; label: string }[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }
  for (const cat of categories) {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(map.get(cat.id)!);
    } else {
      roots.push(map.get(cat.id)!);
    }
  }

  function walk(nodes: (Category & { children: Category[] })[], prefix: string) {
    for (const node of nodes) {
      if (node.id !== excludeId) {
        result.push({ id: node.id, label: prefix + node.name });
        if (node.children.length > 0) {
          walk(node.children as (Category & { children: Category[] })[], prefix + '→ ');
        }
      }
    }
  }

  walk(roots, '');
  return result;
}

function buildFlatWithDepth(categories: Category[]): CategoryRow[] {
  const map = new Map<number, Category>();
  for (const cat of categories) {
    map.set(cat.id, cat);
  }

  function getDepth(id: number): number {
    let depth = 0;
    let current = map.get(id);
    const visited = new Set<number>();
    while (current?.parent_id) {
      if (visited.has(current.parent_id)) break;
      visited.add(current.parent_id);
      depth++;
      current = map.get(current.parent_id);
    }
    return depth;
  }

  return categories.map(cat => ({
    ...cat,
    depth: getDepth(cat.id),
    parent_name: cat.parent_id ? map.get(cat.parent_id)?.name || '-' : '-',
  }));
}

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', parent_id: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { setCategories((await getCategories()).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const displayData = useMemo(() => {
    let rows = buildFlatWithDepth(categories);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.parent_name.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [categories, searchQuery]);

  const handleOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, parent_id: String(category.parent_id || '') });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', parent_id: '' });
    }
    onOpen();
  };

  const handleClose = () => {
    onClose();
    setEditingCategory(null);
    setFormData({ name: '', parent_id: '' });
  };

  const handleSubmit = async () => {
    try {
      const data = { name: formData.name, parent_id: formData.parent_id ? Number(formData.parent_id) : null };
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      fetchCategories(); handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить категорию?')) { await deleteCategory(id); fetchCategories(); }
  };

  const columns: ColumnConfig[] = [
    { key: 'id', label: 'ID', width: '60px' },
    {
      key: 'name', label: 'Название', filterType: 'text',
      render: (val: string, row: CategoryRow) => (
        <Text pl={row.depth * 4} as="span">
          {row.depth > 0 ? <Text as="span" color="gray.400">→ </Text> : null}
          {val}
        </Text>
      )
    },
    { key: 'parent_name', label: 'Родитель', filterType: 'select' },
    {
      key: '_actions', label: 'Действия', sortable: false, filterable: false,
      render: (_: any, row: CategoryRow) => (
        <Flex gap={1}>
          <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(row)} title="Редактировать" />
          <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(row.id)} title="Удалить" />
        </Flex>
      )
    },
  ];

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} gap={4}>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">Категории материалов</Text>
        <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
          <Box position="relative" w={{ base: '100%', md: '250px' }}>
            <ChakraInput placeholder="Поиск по названию..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} pl={8} pr={8} />
            <Box position="absolute" left={2} top="50%" transform="translateY(-50%)" color="gray.400"><FiSearch /></Box>
            {searchQuery && (
              <IconButton aria-label="Очистить поиск" icon={<FiX />} size="xs" variant="ghost" position="absolute" right={1} top="50%" transform="translateY(-50%)" onClick={() => setSearchQuery('')} />
            )}
          </Box>
          <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()} w={{ base: '100%', md: 'auto' }}>Добавить категорию</Button>
        </Flex>
      </Flex>
      <Card><CardBody overflowX="auto">
        <SortableTable columns={columns} data={displayData} size="md" />
      </CardBody></Card>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay /><ModalContent>
          <ModalHeader>{editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}><Box display="flex" flexDirection="column" gap={4}>
            <Box><FormLabel>Название</FormLabel><ChakraInput placeholder="Введите название" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Box>
            <Box><FormLabel>Родительская категория</FormLabel>
              <ChakraSelect placeholder="Без родительской категории" value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}>
                {buildCategoryTree(categories, editingCategory?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </ChakraSelect>
            </Box>
            <Button colorScheme="blue" onClick={handleSubmit}>Сохранить</Button>
          </Box></ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
export default Categories;
