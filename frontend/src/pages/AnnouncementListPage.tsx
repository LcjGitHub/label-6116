import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPin, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { createAnnouncement, deleteAnnouncement, fetchAnnouncements } from '../api/client';
import type { Announcement, AnnouncementFormValues } from '../types';

export function AnnouncementListPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    initialValues: {
      title: '',
      content: '',
      is_pinned: false,
    },
    validate: {
      title: (value) => (value.trim() ? null : '请输入标题'),
      content: (value) => (value.trim() ? null : '请输入正文内容'),
    },
  });

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch {
      setError('加载公告列表失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleSubmit = async (values: AnnouncementFormValues) => {
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await createAnnouncement({
        title: values.title.trim(),
        content: values.content.trim(),
        publish_date: today,
        is_pinned: values.is_pinned,
      });
      notifications.show({
        title: '发布成功',
        message: '公告已发布',
        color: 'green',
      });
      form.reset();
      await loadAnnouncements();
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
          : '发布失败，请稍后重试';
      notifications.show({
        title: '发布失败',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAnnouncement(id);
      notifications.show({
        title: '删除成功',
        message: '公告已删除',
        color: 'green',
      });
      await loadAnnouncements();
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
      notifications.show({
        title: '删除失败',
        message,
        color: 'red',
      });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>公告管理</Title>
        </Group>

        <Paper withBorder radius="md" p="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Title order={4} size="sm">
                发布新公告
              </Title>
              <TextInput
                label="标题"
                placeholder="请输入公告标题"
                withAsterisk
                {...form.getInputProps('title')}
              />
              <Textarea
                label="正文内容"
                placeholder="请输入公告正文内容"
                withAsterisk
                minRows={3}
                autosize
                {...form.getInputProps('content')}
              />
              <Group justify="space-between" align="center">
                <Switch
                  label="置顶公告"
                  {...form.getInputProps('is_pinned', { type: 'checkbox' })}
                />
                <Button type="submit" loading={submitting}>
                  发布公告
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
          </Group>
        ) : announcements.length === 0 ? (
          <Text ta="center" c="dimmed" p="xl">
            暂无公告
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {announcements.map((announcement) => (
              <Card
                key={announcement.id}
                withBorder
                radius="md"
                padding="lg"
                style={{ position: 'relative' }}
              >
                {announcement.is_pinned && (
                  <Badge
                    color="red"
                    size="sm"
                    style={{ position: 'absolute', top: 12, right: 12 }}
                    leftSection={<IconPin size={10} />}
                  >
                    置顶
                  </Badge>
                )}
                <Card.Section withBorder inheritPadding py="xs">
                  <Group justify="space-between" align="center">
                    <Text fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>
                      {announcement.title}
                    </Text>
                  </Group>
                </Card.Section>

                <Text size="sm" c="dimmed" mt="xs" mb="sm">
                  发布日期：{announcement.publish_date}
                </Text>

                <Text size="sm" lineClamp={4} style={{ minHeight: 80 }}>
                  {announcement.content}
                </Text>

                <Group justify="flex-end" mt="md">
                  <Button
                    variant="light"
                    color="red"
                    size="xs"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => handleDelete(announcement.id)}
                  >
                    删除
                  </Button>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
