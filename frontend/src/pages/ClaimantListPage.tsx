import {
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useState } from 'react';
import { createClaimant, fetchClaimants } from '../api/client';
import type { Claimant, ClaimantFormValues } from '../types';

export function ClaimantListPage() {
  const [claimants, setClaimants] = useState<Claimant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchName, setSearchName] = useState('');

  const form = useForm<ClaimantFormValues>({
    initialValues: {
      code: '',
      name: '',
      phone: '',
      remark: '',
    },
    validate: {
      code: (value) => (value.trim() ? null : '请输入编号'),
      name: (value) => (value.trim() ? null : '请输入姓名'),
      phone: (value) => (value.trim() ? null : '请输入联系电话'),
    },
  });

  const loadClaimants = useCallback(async (name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClaimants(name ? { name } : undefined);
      setClaimants(data);
    } catch {
      setError('加载认领人列表失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaimants();
  }, [loadClaimants]);

  const handleSearch = () => {
    loadClaimants(searchName.trim() || undefined);
  };

  const handleSubmit = async (values: ClaimantFormValues) => {
    setSubmitting(true);
    try {
      await createClaimant({
        code: values.code.trim(),
        name: values.name.trim(),
        phone: values.phone.trim(),
        remark: values.remark.trim() || undefined,
      });
      notifications.show({
        title: '新增成功',
        message: '认领人已添加到通讯录',
        color: 'green',
      });
      form.reset();
      await loadClaimants(searchName.trim() || undefined);
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>认领人通讯录</Title>
        </Group>

        <Paper withBorder radius="md" p="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Title order={4} size="sm">
                新增认领人
              </Title>
              <TextInput
                label="编号"
                placeholder="例如 R007"
                withAsterisk
                {...form.getInputProps('code')}
              />
              <TextInput
                label="姓名"
                placeholder="请输入认领人姓名"
                withAsterisk
                {...form.getInputProps('name')}
              />
              <TextInput
                label="联系电话"
                placeholder="请输入联系电话"
                withAsterisk
                {...form.getInputProps('phone')}
              />
              <Textarea
                label="备注"
                placeholder="可选，填写备注信息"
                minRows={2}
                autosize
                {...form.getInputProps('remark')}
              />
              <Group justify="flex-end">
                <Button type="submit" loading={submitting}>
                  确认新增
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group gap="sm" align="flex-end">
            <TextInput
              placeholder="按姓名搜索认领人"
              value={searchName}
              onChange={(e) => setSearchName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              style={{ flex: 1 }}
            />
            <Button onClick={handleSearch}>搜索</Button>
          </Group>
        </Paper>

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
          ) : claimants.length === 0 ? (
            <Text ta="center" c="dimmed" p="xl">
              暂无认领人数据
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>编号</Table.Th>
                  <Table.Th>姓名</Table.Th>
                  <Table.Th>联系电话</Table.Th>
                  <Table.Th>备注</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {claimants.map((claimant) => (
                  <Table.Tr key={claimant.id}>
                    <Table.Td>{claimant.code}</Table.Td>
                    <Table.Td>{claimant.name}</Table.Td>
                    <Table.Td>{claimant.phone}</Table.Td>
                    <Table.Td>{claimant.remark ?? ''}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
