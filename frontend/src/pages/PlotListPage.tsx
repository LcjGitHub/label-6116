import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Combobox,
  Container,
  Group,
  InputBase,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  useCombobox,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconFileText, IconPencil, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { batchDeletePlots, deletePlot, fetchCrops, fetchPlots, updatePlot } from '../api/client';
import { useFilterStore } from '../store/filterStore';
import { PLOT_STATUSES } from '../types';
import type { Crop, Plot, PlotFormValues, PlotStatus } from '../types';

function formatDate(value: string) {
  return value;
}

function getStatusColor(status: PlotStatus): string {
  switch (status) {
    case '种植中':
      return 'green';
    case '已收获':
      return 'blue';
    case '空闲':
      return 'gray';
    default:
      return 'gray';
  }
}

export function PlotListPage() {
  const { claimer, crop, status, setClaimer, setCrop, setStatus, reset } = useFilterStore();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPlot, setDeletingPlot] = useState<Plot | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [batchDeleteSubmitting, setBatchDeleteSubmitting] = useState(false);
  const [batchDeleteError, setBatchDeleteError] = useState<string | null>(null);
  const [debouncedClaimer] = useDebouncedValue(claimer, 300);
  const [debouncedCrop] = useDebouncedValue(crop, 300);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [cropOptions, setCropOptions] = useState<string[]>([]);
  const [cropLoadError, setCropLoadError] = useState<string | null>(null);
  const [cropSearch, setCropSearch] = useState('');
  const editCombobox = useCombobox();

  const editForm = useForm<PlotFormValues>({
    initialValues: {
      plot_number: '',
      claimer: '',
      crop: '',
      claim_date: null,
      expected_harvest_date: null,
      status: '种植中',
    },
    validate: {
      plot_number: (value) => (value.trim() ? null : '请输入地块编号'),
      claimer: (value) => (value.trim() ? null : '请输入认领人'),
      crop: (value) => (value.trim() ? null : '请输入作物'),
      claim_date: (value) => (value ? null : '请选择认领日期'),
      expected_harvest_date: (value, values) => {
        if (!value) return '请选择预计收获日';
        if (values.claim_date && value < values.claim_date) return '预计收获日不能早于认领日期';
        return null;
      },
    },
  });

  const loadPlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlots({
        claimer: debouncedClaimer || undefined,
        crop: debouncedCrop || undefined,
        status: status || undefined,
      });
      setPlots(data);
    } catch {
      setError('加载地块列表失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, [debouncedClaimer, debouncedCrop, status]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  useEffect(() => {
    setSelectedIds([]);
  }, [debouncedClaimer, debouncedCrop, status]);

  const handleDelete = (plot: Plot) => {
    setDeletingPlot(plot);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDeletingPlot(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlot) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deletePlot(deletingPlot.id);
      notifications.show({ title: '删除成功', message: '地块信息已删除', color: 'green' });
      setDeleteModalOpen(false);
      setDeletingPlot(null);
      setDeleteError(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deletingPlot.id));
      await loadPlots();
    } catch {
      setDeleteError('删除失败，请稍后重试');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const allSelected = plots.length > 0 && selectedIds.length === plots.length;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < plots.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(plots.map((plot) => plot.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((prevId) => prevId !== id));
  };

  const handleOpenBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setBatchDeleteError(null);
    setBatchDeleteModalOpen(true);
  };

  const handleCancelBatchDelete = () => {
    setBatchDeleteModalOpen(false);
    setBatchDeleteError(null);
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleteError(null);
    setBatchDeleteSubmitting(true);
    try {
      await batchDeletePlots(selectedIds);
      setBatchDeleteModalOpen(false);
      setSelectedIds([]);
      setBatchDeleteError(null);
      await loadPlots();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err && err.response &&
        typeof err.response === 'object' && 'data' in err.response && err.response.data &&
        typeof err.response.data === 'object' && 'error' in err.response.data
          ? String(err.response.data.error)
          : '删除失败，请稍后重试';
      setBatchDeleteError(message);
    } finally {
      setBatchDeleteSubmitting(false);
    }
  };

  const handleOpenEdit = useCallback(async (plot: Plot) => {
    setEditingPlot(plot);
    setCropSearch(plot.crop);
    editForm.setValues({
      plot_number: plot.plot_number,
      claimer: plot.claimer,
      crop: plot.crop,
      claim_date: dayjs(plot.claim_date).toDate(),
      expected_harvest_date: dayjs(plot.expected_harvest_date).toDate(),
      status: plot.status,
    });
    editForm.resetDirty();
    setEditModalOpen(true);
    setCropLoadError(null);
    try {
      const crops = await fetchCrops();
      setCropOptions(crops.map((c: Crop) => c.name));
      setCropLoadError(null);
    } catch {
      setCropOptions([]);
      setCropLoadError('加载作物列表失败，请确认后端服务已启动');
    }
  }, [editForm]);

  const handleCloseEdit = useCallback(() => {
    setEditModalOpen(false);
    setEditingPlot(null);
    editForm.reset();
  }, [editForm]);

  const handleEditSubmit = useCallback(async (values: PlotFormValues) => {
    if (!editingPlot) return;
    setEditSubmitting(true);
    try {
      await updatePlot(editingPlot.id, {
        plot_number: values.plot_number.trim(),
        claimer: values.claimer.trim(),
        crop: values.crop.trim(),
        claim_date: dayjs(values.claim_date).format('YYYY-MM-DD'),
        expected_harvest_date: dayjs(values.expected_harvest_date).format('YYYY-MM-DD'),
      });
      notifications.show({ title: '编辑成功', message: '认领信息已更新', color: 'green' });
      setEditModalOpen(false);
      setEditingPlot(null);
      editForm.reset();
      await loadPlots();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err && err.response &&
        typeof err.response === 'object' && 'data' in err.response && err.response.data &&
        typeof err.response.data === 'object' && 'error' in err.response.data
          ? String(err.response.data.error)
          : '更新失败，请稍后重试';
      notifications.show({ title: '编辑失败', message, color: 'red' });
    } finally {
      setEditSubmitting(false);
    }
  }, [editingPlot, editForm, loadPlots]);

  const filteredCrops = cropOptions.filter((name) =>
    name.toLowerCase().includes(cropSearch.toLowerCase()),
  );
  const exactMatch = cropOptions.some(
    (name) => name.toLowerCase() === cropSearch.toLowerCase(),
  );

  const statusOptions = [
    { value: '', label: '全部' },
    ...PLOT_STATUSES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Title order={2}>地块列表</Title>
          <Button component={Link} to="/register" leftSection={<IconPlus size={16} />}>
            认领登记
          </Button>
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end">
            <TextInput
              label="认领人"
              placeholder="筛选认领人"
              value={claimer}
              onChange={(event) => setClaimer(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <TextInput
              label="作物"
              placeholder="筛选作物"
              value={crop}
              onChange={(event) => setCrop(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              label="状态"
              placeholder="筛选状态"
              value={status}
              onChange={(value) => setStatus((value as PlotStatus | '') || '')}
              data={statusOptions}
              style={{ flex: 1 }}
            />
            <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={reset}>
              重置
            </Button>
          </Group>
        </Paper>

        {selectedIds.length > 0 && (
          <Group gap="sm" align="center">
            <Button
              color="red"
              variant="light"
              size="sm"
              leftSection={<IconTrash size={16} />}
              onClick={handleOpenBatchDelete}
            >
              批量删除 ({selectedIds.length})
            </Button>
          </Group>
        )}

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
          ) : plots.length === 0 ? (
            <Text ta="center" c="dimmed" p="xl">
              暂无地块数据
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={40}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={indeterminate}
                      onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                      aria-label="全选"
                    />
                  </Table.Th>
                  <Table.Th>地块编号</Table.Th>
                  <Table.Th>认领人</Table.Th>
                  <Table.Th>作物</Table.Th>
                  <Table.Th w={100}>状态</Table.Th>
                  <Table.Th>认领日期</Table.Th>
                  <Table.Th>预计收获日</Table.Th>
                  <Table.Th w={180}>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {plots.map((plot) => (
                  <Table.Tr key={plot.id}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedIds.includes(plot.id)}
                        onChange={(event) => handleSelectOne(plot.id, event.currentTarget.checked)}
                        aria-label={`选择 ${plot.plot_number}`}
                      />
                    </Table.Td>
                    <Table.Td>{plot.plot_number}</Table.Td>
                    <Table.Td>{plot.claimer}</Table.Td>
                    <Table.Td>{plot.crop}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(plot.status)}
                        size="md"
                        style={{ minWidth: 60, paddingLeft: 10, paddingRight: 10 }}
                      >
                        {plot.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(plot.claim_date)}</Table.Td>
                    <Table.Td>{formatDate(plot.expected_harvest_date)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          component={Link}
                          to={`/plots/${plot.id}/logs`}
                          variant="subtle"
                          color="blue"
                          aria-label="日志"
                          title="种植日志"
                        >
                          <IconFileText size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="orange"
                          aria-label="编辑"
                          title="编辑认领信息"
                          onClick={() => handleOpenEdit(plot)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="删除"
                          title="删除地块"
                          onClick={() => handleDelete(plot)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>

      <Modal
        opened={editModalOpen}
        onClose={handleCloseEdit}
        title="编辑认领信息"
        size="sm"
      >
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <Stack gap="md">
            {cropLoadError && (
              <Text c="red" size="sm">
                {cropLoadError}
              </Text>
            )}
            <TextInput
              label="地块编号"
              placeholder="例如 A-03"
              withAsterisk
              {...editForm.getInputProps('plot_number')}
            />
            <TextInput
              label="认领人"
              placeholder="请输入认领人姓名"
              withAsterisk
              {...editForm.getInputProps('claimer')}
            />
            <Combobox
              store={editCombobox}
              onOptionSubmit={(value) => {
                editForm.setFieldValue('crop', value);
                setCropSearch(value);
                editCombobox.closeDropdown();
              }}
            >
              <Combobox.Target>
                <InputBase
                  label="作物"
                  placeholder="选择或输入作物名称"
                  withAsterisk
                  rightSection={<Combobox.Chevron />}
                  value={cropSearch}
                  onChange={(event) => {
                    setCropSearch(event.currentTarget.value);
                    editForm.setFieldValue('crop', event.currentTarget.value);
                    editCombobox.openDropdown();
                    editCombobox.updateSelectedOptionIndex();
                  }}
                  onFocus={() => editCombobox.openDropdown()}
                  onBlur={() => editCombobox.closeDropdown()}
                  error={editForm.errors.crop}
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {filteredCrops.map((name) => (
                    <Combobox.Option key={name} value={name}>
                      {name}
                    </Combobox.Option>
                  ))}
                  {!exactMatch && cropSearch.trim() && (
                    <Combobox.Option value={cropSearch}>
                      新增自定义作物 "{cropSearch}"
                    </Combobox.Option>
                  )}
                  {filteredCrops.length === 0 && !cropSearch.trim() && (
                    <Combobox.Empty>暂无作物数据</Combobox.Empty>
                  )}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
            <DateInput
              label="认领日期"
              placeholder="选择认领日期"
              valueFormat="YYYY-MM-DD"
              withAsterisk
              {...editForm.getInputProps('claim_date')}
            />
            <DateInput
              label="预计收获日"
              placeholder="选择预计收获日"
              valueFormat="YYYY-MM-DD"
              withAsterisk
              {...editForm.getInputProps('expected_harvest_date')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseEdit}>
                取消
              </Button>
              <Button type="submit" loading={editSubmitting}>
                保存修改
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteModalOpen}
        onClose={handleCancelDelete}
        title="确认删除"
        size="sm"
        centered
        withCloseButton={!deleteSubmitting}
        closeOnClickOutside={!deleteSubmitting}
        closeOnEscape={!deleteSubmitting}
      >
        <Stack gap="md">
          <Text size="sm">
            您即将删除以下地块信息，此操作不可撤销，请确认：
          </Text>
          <Paper withBorder p="md" radius="md" bg="gray.0">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">地块编号</Text>
                <Text size="sm" fw={600}>{deletingPlot?.plot_number}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">认领人</Text>
                <Text size="sm" fw={600}>{deletingPlot?.claimer}</Text>
              </Group>
            </Stack>
          </Paper>
          {deleteError && (
            <Text c="red" size="sm">
              {deleteError}
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleCancelDelete} disabled={deleteSubmitting}>
              取消
            </Button>
            <Button
              color="red"
              onClick={handleConfirmDelete}
              loading={deleteSubmitting}
              disabled={deleteSubmitting}
            >
              确认删除
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={batchDeleteModalOpen}
        onClose={handleCancelBatchDelete}
        title="确认批量删除"
        size="sm"
        centered
        withCloseButton={!batchDeleteSubmitting}
        closeOnClickOutside={!batchDeleteSubmitting}
        closeOnEscape={!batchDeleteSubmitting}
      >
        <Stack gap="md">
          <Text size="sm">
            您即将删除 <Text span fw={600}>{selectedIds.length}</Text> 条地块记录，此操作不可撤销，请确认：
          </Text>
          <Paper withBorder p="md" radius="md" bg="gray.0">
            <Text size="sm" c="dimmed" mb="xs">
              选中的地块编号：
            </Text>
            <Text size="sm" fw={500} style={{ wordBreak: 'break-all' }}>
              {plots
                .filter((p) => selectedIds.includes(p.id))
                .map((p) => p.plot_number)
                .join('、')}
            </Text>
          </Paper>
          {batchDeleteError && (
            <Text c="red" size="sm">
              {batchDeleteError}
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleCancelBatchDelete} disabled={batchDeleteSubmitting}>
              取消
            </Button>
            <Button
              color="red"
              onClick={handleConfirmBatchDelete}
              loading={batchDeleteSubmitting}
              disabled={batchDeleteSubmitting}
            >
              确认删除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
