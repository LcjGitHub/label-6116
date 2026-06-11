import {
  ActionIcon,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { createCrop, deleteCrop, fetchCrops } from '../api/client';
import type { Crop, CropFormValues } from '../types';

const CATEGORY_OPTIONS = [
  { value: '叶菜', label: '叶菜' },
  { value: '果菜', label: '果菜' },
  { value: '根茎', label: '根茎' },
];

export function CropListPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCrop, setDeletingCrop] = useState<Crop | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<CropFormValues>({
    initialValues: {
      code: '',
      name: '',
      category: '',
      suitable_season: '',
    },
    validate: {
      code: (value) => (value.trim() ? null : '请输入编号'),
      name: (value) => (value.trim() ? null : '请输入名称'),
      category: (value) => (value.trim() ? null : '请选择分类'),
      suitable_season: (value) => (value.trim() ? null : '请输入适宜季节'),
    },
  });

  const loadCrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCrops();
      setCrops(data);
    } catch {
      setError('加载作物列表失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const handleSubmit = async (values: CropFormValues) => {
    setSubmitting(true);
    try {
      await createCrop({
        code: values.code.trim(),
        name: values.name.trim(),
        category: values.category.trim(),
        suitable_season: values.suitable_season.trim(),
      });
      notifications.show({
        title: '新增成功',
        message: '作物已添加到字典',
        color: 'green',
      });
      form.reset();
      setModalOpen(false);
      await loadCrops();
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
          ? String(err.response.data.error)
          : '提交失败，请稍后重试';
      notifications.show({
        title: '新增失败',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    form.reset();
    setModalOpen(true);
  };

  const openDeleteModal = (crop: Crop) => {
    setDeletingCrop(crop);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingCrop(null);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deletingCrop) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCrop(deletingCrop.id);
      notifications.show({
        title: '删除成功',
        message: `作物「${deletingCrop.name}」已删除`,
        color: 'green',
      });
      closeDeleteModal();
      await loadCrops();
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
          ? String(err.response.data.error)
          : '删除失败，请稍后重试';
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>作物字典</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
            新增作物
          </Button>
        </Group>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
          {loading ? (
            <Group justify="center" p="xl">
              <Loader size="sm" />
            </Group>
          ) : crops.length === 0 ? (
            <Text ta="center" c="dimmed" p="xl">
              暂无作物数据
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>编号</Table.Th>
                  <Table.Th>名称</Table.Th>
                  <Table.Th>分类</Table.Th>
                  <Table.Th>适宜季节</Table.Th>
                  <Table.Th>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {crops.map((crop) => (
                  <Table.Tr key={crop.id}>
                    <Table.Td>{crop.code}</Table.Td>
                    <Table.Td>{crop.name}</Table.Td>
                    <Table.Td>{crop.category}</Table.Td>
                    <Table.Td>{crop.suitable_season}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => openDeleteModal(crop)}
                        title="删除"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="新增作物" size="sm">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="编号"
              placeholder="例如 C009"
              withAsterisk
              {...form.getInputProps('code')}
            />
            <TextInput
              label="名称"
              placeholder="例如 南瓜"
              withAsterisk
              {...form.getInputProps('name')}
            />
            <Select
              label="分类"
              placeholder="请选择分类"
              data={CATEGORY_OPTIONS}
              withAsterisk
              {...form.getInputProps('category')}
            />
            <TextInput
              label="适宜季节"
              placeholder="例如 春、夏、秋"
              withAsterisk
              {...form.getInputProps('suitable_season')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={() => setModalOpen(false)} type="button">
                取消
              </Button>
              <Button type="submit" loading={submitting}>
                确认新增
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deleteModalOpen} onClose={closeDeleteModal} title="删除作物" size="sm">
        <Stack gap="md">
          <Text>
            确定要删除作物「<Text span fw="bold">{deletingCrop?.name}</Text>」吗？此操作不可撤销。
          </Text>
          {deleteError && (
            <Text c="red" size="sm">
              {deleteError}
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal} type="button" disabled={deleting}>
              取消
            </Button>
            <Button color="red" onClick={handleDelete} loading={deleting}>
              确认删除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
