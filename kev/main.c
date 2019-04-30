#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// keys : strings
// values : strings
// GET / PUT / KEYS request
// DEL write a tombstone

typedef struct List {
  char* key;
  char* value;
  struct List* tail;
} List;

typedef struct PutPayload {
  char* key;
  char* value;
} PutPayload;

typedef enum CommandType {
  PUT
} CommandType;

typedef struct Command {
  CommandType command_type;
  union {
    PutPayload put;
    //GetPayload get;
  } payload;
} Command;

char* lookup(List* store, char* key) {
  List* p = store;
  while (p != NULL) {
    if (strcmp(p->key, key) == 0) {
      return p->value;
    }
    p = p->tail;
  }

  return NULL;
}

int contains(List* store, char* key) {
  List* p = store;
  while (p != NULL) {
    if (strcmp(p->key, key) == 0) {
      return 1;
    }
    p = p->tail;
  }

  return 0;
}

List* prepend(char* key, char* value, List* store) {
  List* tmp = malloc(sizeof(List));
  tmp->key = key;
  tmp->value = value;
  tmp->tail = store;
  return tmp;
}

List* init_store(FILE* data_file) {
  List* store = NULL;

  if (data_file == NULL) {
    return store;
  }

  while (1) {
    size_t key_len = 0;
    char* key = NULL;
    size_t value_len = 0;
    char* value = NULL;
    size_t bytes_read;

    if ((bytes_read = getline(&key, &key_len, data_file)) == -1) {
      free(key);
      break;
    }
    key[bytes_read - 1] = '\0';
    if ((bytes_read = getline(&value, &value_len, data_file)) == -1) {
      free(key);
      free(value);
      break;
    }
    value[bytes_read - 1] = '\0';
    if (value[0] == '\0') {
      free(value);
      value = NULL;
    }
    store = prepend(key, value, store);
  }

  return store;
}

Command create_put(char* key, char* value) {
  Command command = {
    .command_type = PUT,
    .payload.put = { .key = key, .value = value }
  };
  return command;
}

List* update(Command command, List* store) {
  return prepend(command.payload.put.key, command.payload.put.value, store);
}

void write_command(Command command, FILE* data_file) {
  if (data_file == NULL) {
    return;
  }

  switch (command.command_type) {
  case PUT:
    fputs(command.payload.put.key, data_file);
    fputc('\n', data_file);
    if (command.payload.put.value != NULL) {
      fputs(command.payload.put.value, data_file);
    }
    fputc('\n', data_file);
    break;
  }
}

int main (int argc, char** argv) {
  FILE* data_file = argc >= 2 ? fopen(argv[1], "a+") : NULL;

  List* store = init_store(data_file);

  size_t len = 1 << 10;
  char* line = (char*) malloc(len);

  setbuf(stdout, NULL);

  while (getline(&line, &len, stdin) != -1) {
    if (strncmp(line, "KEYS\n", len) == 0) {
      List* seen = NULL;

      List* p = store;
      while (p != NULL) {
        if (!contains(seen, p->key)) {
          seen = prepend(p->key, p->value, seen);
        }
        p = p->tail;
      }

      p = seen;
      while (p != NULL) {
        if (p->value != NULL) {
          printf("%s\n", p->key);
        }
        p = p->tail;
      }

      printf("OK\n");
      continue;
    }

    {
      char* key = NULL;
      if (sscanf(line, "DEL %ms\n", &key) == 1) {
        Command command = create_put(key, NULL);
        write_command(command, data_file);
        store = update(command, store);
        printf("OK\n");
        continue;
      }
    }

    {
      char* key = NULL;
      char* value = NULL;
      if (sscanf(line, "PUT %ms %ms\n", &key, &value) == 2) {
        Command command = create_put(key, value);
        write_command(command, data_file);
        store = update(command, store);
        printf("OK\n");
        continue;
      }
    }

    {
      char* key = NULL;
      if (sscanf(line, "GET %ms\n", &key) == 1) {
        char* value = lookup(store, key);

        if (value != NULL) {
          printf("%s\n", value);
          printf("OK\n");
          continue;
        }
      }
    }

    if (strncmp(line, "QUIT\n", len) == 0) {
      printf("So long and thanks for all the fish.\n");
      printf("OK\n");
      break;
    }

    printf("NOT OK\n");
  }

  List* p = NULL;
  while (store != NULL) {
    p = store;
    store = store->tail;
    free(p->key);
    free(p->value);
    free(p);
  }

  printf("Run away Brave sir Robin\n");

  free(line);

  return 0;
}
