#include <assert.h>
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <unistd.h>

// https://en.wikibooks.org/wiki/X86_Assembly/X86_Architecture
// http://www.c-jump.com/CIS77/CPU/x86/lecture.html#X77_0020_encoding_overview
// http://ref.x86asm.net/coder64-abc.html

typedef enum x86_opcode {
  X86_OPCODE_ADD,
  X86_OPCODE_ADD64_IMM8,
  X86_OPCODE_SUB_REG64,
  X86_OPCODE_MOV,
  X86_OPCODE_MOV_REG64,
  X86_OPCODE_MOV_IMM32,
  X86_OPCODE_MOV_IMM64,
  X86_OPCODE_MOV_LOAD,
  X86_OPCODE_MOV_STORE32_DISPLACEMENT8,
  X86_OPCODE_RET,
  X86_OPCODE_LABEL,
  X86_OPCODE_CALL,
  X86_OPCODE_CALL_REG,
  X86_OPCODE_PUSH,
  X86_OPCODE_POP,
} x86_opcode_t;

typedef enum x86_reg {
  X86_REG_RDI = 0b111, // scratch register
  X86_REG_RSI = 0b110, // scratch register
  X86_REG_RBP = 0b101, // base pointer / frame pointer
  X86_REG_RSP = 0b100, // stack pointer
  X86_REG_RBX = 0b011,
  X86_REG_RDX = 0b010, // scratch register
  X86_REG_RCX = 0b001, // scratch register
  X86_REG_RAX = 0b000  // scratch register
} x86_reg_t;

typedef struct x86_inst {
  x86_opcode_t opcode;
} x86_inst_t;

typedef struct x86_add {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_add_t;

typedef struct x86_add64_imm8 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  uint8_t src;
} x86_add64_imm8_t;

typedef struct x86_sub_reg64 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_sub_reg64_t;

typedef struct x86_mov {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_mov_t;

typedef struct x86_mov_reg64 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src;
} x86_mov_reg64_t;

typedef struct x86_mov_imm32 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  uint32_t src;
} x86_mov_imm32_t;

typedef struct x86_mov_imm64 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  uint64_t src;
} x86_mov_imm64_t;

typedef struct x86_mov_load {
  x86_opcode_t opcode;
  x86_reg_t dest;
  x86_reg_t src_base;
  x86_reg_t src_index;
  uint8_t src_scale;
} x86_mov_load_t;

typedef struct x86_mov_store32_displacement8 {
  x86_opcode_t opcode;
  x86_reg_t dest;
  uint8_t dest_displacement;
  x86_reg_t src;
} x86_mov_store32_displacement8_t;

typedef struct x86_ret {
  x86_opcode_t opcode;
} x86_ret_t;

typedef struct x86_label {
  x86_opcode_t opcode;
  char* label;
} x86_label_t;

typedef struct x86_call {
  x86_opcode_t opcode;
  void* ptr;
} x86_call_t;

typedef struct x86_call_reg {
  x86_opcode_t opcode;
  x86_reg_t dest;
} x86_call_reg_t;

typedef struct x86_push {
  x86_opcode_t opcode;
  x86_reg_t src;
} x86_push_t;

typedef struct x86_pop {
  x86_opcode_t opcode;
  x86_reg_t dest;
} x86_pop_t;

x86_inst_t* x86_add(x86_reg_t dest, x86_reg_t src) {
  x86_add_t* add = malloc(sizeof(x86_add_t));
  add->opcode = X86_OPCODE_ADD;
  add->dest = dest;
  add->src = src;
  return (x86_inst_t*) add;
}

x86_inst_t* x86_add64_imm8(x86_reg_t dest, uint8_t src) {
  x86_add64_imm8_t* add = malloc(sizeof(x86_add64_imm8_t));
  add->opcode = X86_OPCODE_ADD64_IMM8;
  add->dest = dest;
  add->src = src;
  return (x86_inst_t*) add;
}

x86_inst_t* x86_sub_reg64(x86_reg_t dest, x86_reg_t src) {
  x86_sub_reg64_t* sub = malloc(sizeof(x86_sub_reg64_t));
  sub->opcode = X86_OPCODE_SUB_REG64;
  sub->dest = dest;
  sub->src = src;
  return (x86_inst_t*) sub;
}

x86_inst_t* x86_mov(x86_reg_t dest, x86_reg_t src) {
  x86_mov_t* mov = malloc(sizeof(x86_mov_t));
  mov->opcode = X86_OPCODE_MOV;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_reg64(x86_reg_t dest, x86_reg_t src) {
  x86_mov_reg64_t* mov = malloc(sizeof(x86_mov_reg64_t));
  mov->opcode = X86_OPCODE_MOV_REG64;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_imm32(x86_reg_t dest, uint32_t src) {
  x86_mov_imm32_t* mov = malloc(sizeof(x86_mov_imm32_t));
  mov->opcode = X86_OPCODE_MOV_IMM32;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_imm64(x86_reg_t dest, uint64_t src) {
  x86_mov_imm64_t* mov = malloc(sizeof(x86_mov_imm64_t));
  mov->opcode = X86_OPCODE_MOV_IMM64;
  mov->dest = dest;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_load(x86_reg_t dest,
                         x86_reg_t src_base,
                         x86_reg_t src_index,
                         uint8_t src_scale) {
  x86_mov_load_t* mov = malloc(sizeof(x86_mov_load_t));
  mov->opcode = X86_OPCODE_MOV_LOAD;
  mov->dest = dest;
  mov->src_base = src_base;
  mov->src_index = src_index;
  mov->src_scale = src_scale;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_mov_store32_displacement8(x86_reg_t dest,
                                          uint8_t dest_displacement,
                                          x86_reg_t src) {
  x86_mov_store32_displacement8_t* mov = malloc(sizeof(x86_mov_store32_displacement8_t));
  mov->opcode = X86_OPCODE_MOV_STORE32_DISPLACEMENT8;
  mov->dest = dest;
  mov->dest_displacement = dest_displacement;
  mov->src = src;
  return (x86_inst_t*) mov;
}

x86_inst_t* x86_ret() {
  x86_ret_t* ret = malloc(sizeof(x86_ret_t));
  ret->opcode = X86_OPCODE_RET;
  return (x86_inst_t*) ret;
}

x86_inst_t* x86_label(char* label) {
  x86_label_t* inst = malloc(sizeof(x86_label_t));
  inst->opcode = X86_OPCODE_LABEL;
  inst->label = label;
  return (x86_inst_t*) inst;
}

x86_inst_t* x86_call(void* ptr) {
  x86_call_t* inst = malloc(sizeof(x86_call_t));
  inst->opcode = X86_OPCODE_CALL;
  inst->ptr = ptr;
  return (x86_inst_t*) inst;
}

x86_inst_t* x86_call_reg(x86_reg_t dest) {
  x86_call_reg_t* inst = malloc(sizeof(x86_call_reg_t));
  inst->opcode = X86_OPCODE_CALL_REG;
  inst->dest = dest;
  return (x86_inst_t*) inst;
}

x86_inst_t* x86_push(x86_reg_t src) {
  x86_push_t* inst = malloc(sizeof(x86_push_t));
  inst->opcode = X86_OPCODE_PUSH;
  inst->src = src;
  return (x86_inst_t*) inst;
}

x86_inst_t* x86_pop(x86_reg_t dest) {
  x86_pop_t* inst = malloc(sizeof(x86_pop_t));
  inst->opcode = X86_OPCODE_POP;
  inst->dest = dest;
  return (x86_inst_t*) inst;
}

x86_inst_t** function_instructions[100];
void* functions[100];

size_t assemble_inst(x86_inst_t* inst, char* output) {
  switch (inst->opcode) {
  case X86_OPCODE_ADD:
    x86_add_t* add = (x86_add_t*) inst;
    output[0] = 0x01;
    output[1] = (0b11 << 6) | (add->src << 3) | add->dest;
    return 2;
  case X86_OPCODE_ADD64_IMM8:
    x86_add64_imm8_t* add64_imm8 = (x86_add64_imm8_t*) inst;
    output[0] = 0x48;
    output[1] = 0x83;
    output[2] = (0b11 << 6) | (add64_imm8->dest);
    output[3] = add64_imm8->src;
    return 4;
  case X86_OPCODE_SUB_REG64:
    x86_sub_reg64_t* sub_reg64 = (x86_sub_reg64_t*) inst;
    output[0] = 0x48;
    output[1] = 0x29;
    output[2] = (0b11 << 6) | (sub_reg64->src << 3) | sub_reg64->dest;
    return 3;
  case X86_OPCODE_CALL:
    x86_call_t* call = (x86_call_t*) inst;
    output[0] = 0xe8;
    ssize_t offset = ((ssize_t)call->ptr) - (((ssize_t)output) + 5);
    assert(offset >= INT32_MIN && offset <= INT32_MAX);
    *((int32_t*)&output[1]) = offset;
    return 5;
  case X86_OPCODE_CALL_REG:
    x86_call_reg_t* call_reg = (x86_call_reg_t*) inst;
    output[0] = 0xff;
    output[1] = (0b11 << 6) | (0x2 << 3) | call_reg->dest;
    return 2;
  case X86_OPCODE_LABEL:
    return 0;
  case X86_OPCODE_MOV:
    x86_mov_t* mov = (x86_mov_t*) inst;
    output[0] = 0x89;
    output[1] = (0b11 << 6) | (mov->src << 3) | mov->dest;
    return 2;
  case X86_OPCODE_MOV_REG64:
    x86_mov_reg64_t* mov_reg64 = (x86_mov_reg64_t*) inst;
    output[0] = 0x48;
    output[1] = 0x89;
    output[2] = (0b11 << 6) | (mov_reg64->src << 3) | mov_reg64->dest;
    return 3;
  case X86_OPCODE_MOV_IMM32:
    x86_mov_imm32_t* mov_imm32 = (x86_mov_imm32_t*) inst;
    output[0] = 0xc7;
    output[1] = (0b11 << 6) | (mov_imm32->dest);
    *((uint32_t*)&output[2]) = mov_imm32->src;
    return 6;
  case X86_OPCODE_MOV_IMM64:
    x86_mov_imm64_t* mov_imm64 = (x86_mov_imm64_t*) inst;
    output[0] = 0x48;
    output[1] = 0xb8 + mov_imm64->dest;
    *((uint64_t*)&output[2]) = mov_imm64->src;
    return 10;
  case X86_OPCODE_MOV_LOAD:
    x86_mov_load_t* mov_load = (x86_mov_load_t*) inst;
    output[0] = 0x48;
    output[1] = 0x8b;
    output[2] = (0b00 << 6) | (mov_load->dest << 3) | 0b100;
    output[3] = (mov_load->src_scale << 6) | (mov_load->src_index << 3) | (mov_load->src_base);
    return 4;
  case X86_OPCODE_MOV_STORE32_DISPLACEMENT8:
    x86_mov_store32_displacement8_t* mov_store32_displacement8 = (x86_mov_store32_displacement8_t*) inst;
    output[0] = 0x89;
    output[1] = (0b01 << 6) | (mov_store32_displacement8->src << 3) | (mov_store32_displacement8->dest);
    output[2] = mov_store32_displacement8->dest_displacement;
    return 3;
  case X86_OPCODE_RET:
    output[0] = 0xc3;
    return 1;
  case X86_OPCODE_PUSH:
    x86_push_t* push = (x86_push_t*) inst;
    output[0] = 0x48;
    output[1] = 0x50 + push->src;
    return 2;
  case X86_OPCODE_POP:
    x86_pop_t* pop = (x86_pop_t*) inst;
    output[0] = 0x48;
    output[1] = 0x58 + pop->dest;
    return 2;
  default:
    return 0;
  }
}

void* assemble(x86_inst_t** instructions) {
  int pagesize = getpagesize();
  char* m = mmap(NULL,
                 pagesize,
                 PROT_READ | PROT_WRITE | PROT_EXEC,
                 MAP_SHARED | MAP_ANONYMOUS,
                 -1,
                 0);

  size_t output_index = 0;
  for (size_t i = 0; instructions[i] != NULL; i++) {
    output_index += assemble_inst(instructions[i], &m[output_index]);
  }

  return m;
}

void* jit_function(size_t func_index) {
  if (functions[func_index] == NULL) {
    functions[func_index] = assemble(function_instructions[func_index]);
  }

  return functions[func_index];
}

size_t FUNCTION_G = 0;
size_t FUNCTION_F = 1;

int main () {

  x86_inst_t* jit_call_instructions[] = {
    // jit_call()
    //x86_push(X86_REG_RSI), // save argument 1
    x86_mov_imm64(X86_REG_RAX, (uint64_t) jit_function),
    x86_call_reg(X86_REG_RAX),
    //x86_pop(X86_REG_RDI), // restore argument 1
    //x86_call_reg(X86_REG_RAX),

    // Pop return address into RDI
    x86_pop(X86_REG_RDI),
    // Calculate offset for call
    x86_sub_reg64(X86_REG_RAX, X86_REG_RDI),
    // Store offset for call (offset is last 4 bytes of call instruction)
    x86_mov_store32_displacement8(X86_REG_RDI, -4, X86_REG_RAX),
    // Change return address to return to call (call instruction is 5 bytes)
    x86_add64_imm8(X86_REG_RDI, -5),
    // Push modified return address
    x86_push(X86_REG_RDI),

    // TODO: handle JIT calls with > 0 arguments

    x86_ret(),
    NULL,
  };

  void* jit_call = assemble(jit_call_instructions);

  x86_inst_t* f_instructions[] = {
    //x86_mov_reg64(X86_REG_RAX, X86_REG_RDI),
    //x86_add64_imm8(X86_REG_RAX, -5),
    //x86_ret(),

    // f(a) { return g() + a; }
    x86_label("f"),
    x86_mov(X86_REG_RBX, X86_REG_RDI),
    // call g()
    x86_mov_imm32(X86_REG_RDI, FUNCTION_G),
    x86_call(jit_call),
    // x86_call(functions[FUNCTION_G]),
    x86_add(X86_REG_RAX, X86_REG_RBX),
    x86_ret(),
    NULL,
  };

  x86_inst_t* g_instructions[] = {
    // g() { return 10; }
    x86_label("g"),
    x86_mov_imm32(X86_REG_RAX, 10),
    x86_ret(),
    NULL,
  };

  function_instructions[FUNCTION_F] = f_instructions;
  function_instructions[FUNCTION_G] = g_instructions;

  //uint64_t (*jit)(size_t, uint64_t) = (uint64_t (*)(size_t, uint64_t)) jit_call;

  uint64_t (*f)(uint64_t) = (uint64_t (*)(uint64_t))jit_function(FUNCTION_F);

  //uint64_t result = jit(FUNCTION_F, 3);
  uint64_t result = f(3);
  printf("%lu\n", result);

  return 0;
}
