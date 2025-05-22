<div class="form-group-control">
    <select class="form-control select2-custom {{ $class }}" name="{{ $name }}" id="{{ $id }}" {{ $disabled }} data-selected="{{ $selected }}">
        <option value="">...</option>
        @foreach($options as $item)
            @php($select = $item->id == $selected ? 'selected' : '')
            <option value="{{ $item->id }}" {{ $select }}>{{ $item->education_name }}</option>
        @endforeach
    </select>
</div>
